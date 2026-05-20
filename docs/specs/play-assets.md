# Store Assets Feature Spec

> **Status**: Active
> **Last updated**: 2026-05-20
> **Coverage**: Entities, Business Rules, Repository, Data Source, Use Cases, API, UI State Machine, Edge Cases, Security

The single feature of App Grabber: given an app name or id, a target store
(Google Play or the App Store) and a locale, resolve the listing and expose
every downloadable image at its maximum resolution, individually or as a ZIP.

The two stores share one domain, one set of use cases and one UI; they
differ only in `data/` (one scraper, mapper and image resolver each) and in
which repository the composition root wires per request.

## 1. Entity Contract

### StoreId

`"play" | "appstore"` — selects the data source in `di.ts`.

### AppAsset

| Field    | Type        | Notes                                                       |
| -------- | ----------- | ----------------------------------------------------------- |
| kind     | `AssetKind` | `icon` \| `featureGraphic` \| `screenshot`                  |
| name     | `string`    | Stable slug: `icon`, `feature-graphic`, `screenshot-01`, …  |
| fileName | `string`    | Download name, e.g. `screenshot-01.png`                     |
| url      | `string`    | Max-resolution URL on the store's image CDN                 |

`featureGraphic` is Google Play only; the App Store has no equivalent.

### AppSummary (a single search hit)

`appId`, `title`, `developer`, `icon` — all `string`.

### AppAssetBundle (a resolved app)

`appId`, `title`, `developer` (`string`), `store` (`StoreId`), `listingUrl`
(`string`, the public Play/App Store page) + `assets: readonly AppAsset[]`.

### StoreLocale / SearchQuery / GrabRequest

- `StoreLocale` = `{ country: string; lang: string }`.
- `SearchQuery` = `StoreLocale` + `{ term: string }`.
- `GrabRequest` = `StoreLocale` + `{ term?: string; appId?: string }`.

The store is **not** part of these — it is chosen at the composition root,
so use cases and entities stay store-agnostic.

## 2. Business Rules

1. **Max resolution**, per store:
   - **Play**: strip any trailing `=...` size suffix and append `=s0`, which
     returns the original asset instead of the ~512px thumbnail (`maxRes`).
   - **App Store**: rewrite the `<w>x<h>` token in the mzstatic path to a
     large box (9999), keeping aspect ratio and crop code. Apple only
     downscales, so this yields the source asset without letterboxing.
2. **Asset ordering**:
   - **Play**: icon, then feature graphic, then screenshots in listing order.
   - **App Store**: icon, then iPhone screenshots, then iPad screenshots.
3. **Screenshot numbering**: `screenshot-NN`, 1-based, zero-padded to two
   digits. App Store iPad screenshots use `screenshot-ipad-NN` so file names
   never collide with the iPhone set.
4. **Missing assets are skipped**: an absent icon/feature graphic/screenshot
   set produces no entry (no placeholder).
5. **File extension**: derived from the URL
   (`.png/.jpg/.jpeg/.webp/.gif`), defaulting to `.png` when undetectable.
6. **Search returns the top match only**: `num: 1`; the first result wins
   (both stores).
7. **Id skips search**: when `appId` is provided it is used directly and
   `term` is ignored. A Play id is a package name (`com.x`); an App Store id
   is a numeric track id (`310633997`) or a bundle id
   (`net.whatsapp.WhatsApp`), routed by shape in the App Store data source.
8. **Input required**: a request with neither a non-blank `term` nor a
   non-blank `appId` is a `ValidationError`.
9. **Locale defaults**: missing/invalid `country`/`lang` default to `us` /
   `en`; accepted values are two ASCII letters (normalised lowercase).
10. **ZIP file name**: `slugify(title || appId) + ".zip"`, slug capped at
    60 chars.
11. **Download size multiplier**: a global `0.3x / 0.5x / 1x` picker rescales
    downloads. The longest-side resize dispatches on the URL host
    (`image-url.ts`): Play uses the `=s<px>` suffix, the App Store rewrites
    the size token. `1x` (or not-yet-measured) downloads the original.
12. **Per-asset resolution** is measured in the browser by loading the
    original image, and shown on each card as `w×h`.
13. **ZIP** receives the (already size-scaled) URLs + file names from the
    client; the server re-validates every host before fetching (see §9).
14. **Store selection**: the request's `store` (`play` | `appstore`,
    defaulting to `play` when absent or unknown) selects the repository in
    `di.ts`. Everything downstream is identical.

## 3. Repository Contract

```ts
interface StoreAssetsRepository {
  search(query: SearchQuery): Promise<Result<AppSummary>>;
  getAssets(appId: string, locale: StoreLocale): Promise<Result<AppAssetBundle>>;
}
```

### Behavior

- One implementation per store: `PlayAssetsRepositoryImpl` and
  `AppStoreAssetsRepositoryImpl`.
- **search**: returns the first result mapped to `AppSummary` via the shared
  `topSummary`; empty results → `Left(NotFoundError)`.
- **getAssets**: fetches the full listing, builds the asset bundle via the
  store's mapper, and tags it with `store` + `listingUrl`.
- **Both**: catch thrown scraper errors and map them onto the domain
  hierarchy via the shared `toAppError(error, storeName)` — `404`/“not found”
  → `NotFoundError`, transport failures
  (`ENOTFOUND`/`ETIMEDOUT`/`ECONNRESET`/`ECONNREFUSED`/fetch) →
  `NetworkError`, anything else → `ServerError`.

## 4. Data Source Contract

```ts
interface PlayStoreDataSource {
  search(query: SearchQuery): Promise<IAppItem[]>;
  app(appId: string, locale: StoreLocale): Promise<IAppItemFullDetail>;
}

interface AppStoreDataSource {
  search(query: SearchQuery): Promise<AppStoreApp[]>;
  app(appId: string, locale: StoreLocale): Promise<AppStoreApp>;
}
```

- `GplayDataSource` (backed by `google-play-scraper`) and `ItunesDataSource`
  (backed by Apple's official iTunes Search/Lookup APIs via built-in `fetch`,
  no third-party scraper) are the live implementations. Each is the **only**
  module that touches its store's external boundary.
- `search` keeps a single match (`num: 1` on Play, `limit=1` on the App
  Store).
- `ItunesDataSource.app` queries by `id` for a numeric id and by `bundleId`
  otherwise; an empty lookup throws so the repository maps it to NotFound.

## 5. Use Cases

| Use case               | `call(...)`                                  | Delegates to          |
| ---------------------- | -------------------------------------------- | --------------------- |
| `SearchAppUseCase`     | `(SearchQuery) → Result<AppSummary>`         | `repo.search`         |
| `GetAppAssetsUseCase`  | `(appId, StoreLocale) → Result<AppAssetBundle>` | `repo.getAssets`   |
| `GrabAppAssetsUseCase` | `(GrabRequest) → Result<AppAssetBundle>`     | the two above         |

`GrabAppAssetsUseCase` orchestrates rule 7/8: use `appId` directly when
present; otherwise validate the term, search, then fetch assets for the
match. A failed search short-circuits (assets are not fetched). The use
cases are store-agnostic: `di.ts` injects the store-specific repository.

## 6. API Contract

| Route                    | Method | Input                                  | Success            | Errors                        |
| ------------------------ | ------ | -------------------------------------- | ------------------ | ----------------------------- |
| `/api/assets`            | POST   | JSON `AssetsRequestBody`               | `AppAssetBundle`   | 400 / 404 / 502 / 500         |
| `/api/download`          | GET    | `?url=&name=`                          | image stream (attachment) | 400 (bad/disallowed url), 502 |
| `/api/download/zip`      | POST   | JSON `{ zipName?, items[] }`           | `application/zip` stream | 400 (empty / >100 items)      |

- `AssetsRequestBody` adds an optional `store` (`play` | `appstore`); an
  absent or unrecognised value falls back to `play`.
- Error body is the uniform envelope `{ error: { kind, message } }`.
- HTTP status is derived from the error kind by `toHttpStatus`
  (validation→400, notFound→404, network→502, server→500).
- All routes pin `runtime = "nodejs"`.

## 7. UI State Machine

`playGrabberReducer(state, action)` — pure, the Cubit analogue:

```
State: { status, bundle, errorMessage, request }
status ∈ idle | loading | loaded | error

idle ──submit(request)──▶ loading       (clears bundle + error, stores request)
loading ──loaded(bundle)─▶ loaded        (keeps request)
loading ──error(message)─▶ error         (keeps request, clears bundle)
(any) ──submit──▶ loading
(any) ──reset──▶ idle (initial state)
```

`usePlayGrabber` is the only React binding: it dispatches `submit`,
performs `POST /api/assets`, and dispatches `loaded`/`error`. The search
form carries the store toggle (Google Play / App Store) and includes it in
the request. The result view reads `bundle.store`/`bundle.listingUrl` for
the store link and label.

## 8. Edge Cases

| Scenario                                  | Expected behavior                                            |
| ----------------------------------------- | ----------------------------------------------------------- |
| Empty search results                      | `NotFoundError` → 404, UI shows the error banner            |
| App id does not exist                     | scraper throws 404 → `NotFoundError`                        |
| Listing with zero images                  | `AppAssetBundle` with empty `assets`; UI shows empty state, no ZIP button |
| iPhone-only App Store app                 | no iPad screenshots; icon + iPhone screenshots only          |
| App Store id given as numeric or bundle   | both resolve (data source routes by shape)                  |
| Blank/whitespace term                     | `ValidationError` (rule 8)                                  |
| Unknown country/lang                      | defaults to `us`/`en` (rule 9)                              |
| Unknown `store` value                     | defaults to `play` (rule 14)                                |
| One asset fails to download in the ZIP    | that asset is skipped; the ZIP still completes              |
| Network failure reaching a store          | `NetworkError` → 502                                        |
| Malformed JSON body on `/api/assets`      | `ValidationError` → 400                                     |

## 9. Security

- **SSRF allow-list**: `isAllowedImageHost` permits only HTTPS on
  `play-lh.googleusercontent.com` or a subdomain of `mzstatic.com`. The
  App Store check is a **suffix** match (`*.mzstatic.com`), which accepts
  `is1-ssl.mzstatic.com` but rejects look-alikes such as
  `mzstatic.com.evil.com`. Both download routes re-check every URL before
  fetching it server-side.
- **ZIP host re-validation**: the ZIP route accepts client-supplied
  (size-scaled) URLs but re-checks every one against the host allow-list
  before fetching, caps the list at 100 items, and sanitizes each file
  name. The allow-list (not the URL source) is what blocks SSRF.
- **Header safety**: download file names are sanitized
  (`sanitizeFileName`) — path separators and CR/LF/quote characters are
  stripped before they reach `Content-Disposition`.
- **No caching of downloads**: download responses set `Cache-Control: no-store`.
