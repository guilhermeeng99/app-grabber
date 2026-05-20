# Store Assets Feature Spec

> **Status**: Active
> **Last updated**: 2026-05-20
> **Coverage**: Entities, Business Rules, Repository, Data Source, Use Cases, API, UI State Machine, Edge Cases, Security

The single feature of App Grabber: given an app name (or an exact store id)
and a locale, resolve the listing(s) and expose every downloadable image at
its maximum resolution, grouped by section (icon / banner / phone / tablet),
individually or as per-section / full ZIPs.

A **name** search runs against **both** stores at once and returns one
outcome per store (each may independently succeed or fail). An **id** search
targets the single store the id belongs to.

The two stores share one domain, one set of use cases and one UI; they
differ only in `data/` (one scraper, mapper and image resolver each) and in
which repository the composition root wires per store.

## 1. Entity Contract

### StoreId

`"play" | "appstore"` — selects the data source in `di.ts`.

### AppAsset

| Field    | Type           | Notes                                                                                 |
| -------- | -------------- | ------------------------------------------------------------------------------------- |
| kind     | `AssetKind`    | `icon` \| `featureGraphic` \| `screenshot`                                            |
| section  | `AssetSection` | `icon` \| `banner` \| `phone` \| `tablet` — drives UI grouping + per-section download |
| name     | `string`       | Stable slug: `icon`, `feature-graphic`, `screenshot-01`, …                            |
| fileName | `string`       | Download name, e.g. `screenshot-01.png`                                               |
| url      | `string`       | Max-resolution URL on the store's image CDN                                           |

`featureGraphic` (section `banner`) is Google Play only; the App Store has
no equivalent. `section` is set by each store's mapper so the UI groups assets
without parsing names. The App Store splits `phone` vs `tablet` (iPad) at the
source; Play's scraper merges both into one untagged list, so the Play mapper
tags every screenshot `phone` and the UI reclassifies tablet-shaped ones by
measured aspect ratio (see rule 15 and the UI section).

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
6. **Search returns the top match only**: the data source fetches a small
   page (`num: 5` on Play, `limit: 5` on the App Store) and the repository
   keeps the first hit. Fetching >1 is deliberate: Google's search-page
   parser intermittently returns `[]` for `num: 1`, so a slightly larger
   page is far more reliable. Play search additionally **retries once on an
   empty result** (~800ms backoff) and **caches non-empty results** for a
   few minutes, both to absorb Google's rate-limiting (empty responses are
   never cached, so a throttled miss is retried, not memoised).
7. **Id skips search**: when `appId` is provided it is used directly and
   `term` is ignored. A Play id is a package name (`com.x`); an App Store id
   is a numeric track id (`310633997`) or a bundle id
   (`net.whatsapp.WhatsApp`), routed by shape in the App Store data source.
   The `appId` may also be a **pasted store URL**: a Google Play details link
   (`play.google.com/store/apps/details?id=<pkg>`) or an App Store listing
   link (`apps.apple.com/.../id<digits>`, also `itunes.apple.com`).
   `parseStoreAppId` pulls the bare id and the store the link names out of it;
   a recognised link's store overrides the request's `store` (rule 14). Any
   other input (a raw id, an unrecognised host, a link with no extractable id)
   is passed through trimmed and unchanged.
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
14. **Store selection**:
    - **By name** (`term`, no `appId`): both stores are resolved in parallel;
      the response carries one outcome per store. A store that fails (not
      found, network, throttle) yields an error outcome without affecting
      the other.
    - **By id** (`appId`): only the store given by `store` (`play` |
      `appstore`, defaulting to `play` when absent or unknown) is resolved;
      the response carries that single outcome. The id shape is store-bound
      (Play package vs App Store numeric/bundle id), so id search is never
      cross-store. When the `appId` is a pasted store URL (rule 7), the store
      named by the URL wins over the supplied `store`.
15. **Asset sections**: every asset carries a `section` (`icon` | `banner` |
    `phone` | `tablet`), set by the store's mapper. The UI renders one block
    per non-empty section, in the order icon, banner, phone, tablet. The App
    Store splits phone vs tablet at the source; Play's scraper merges both into
    one untagged list, so the UI reclassifies tablet-shaped Play screenshots
    (measured shorter÷longer side ratio ≥ 0.65) from `phone` to `tablet` before
    grouping. Heuristic: it relies on the browser-measured size, so the split
    settles as images load and unusual aspect ratios may misclassify.
16. **Per-section download**: each section block offers its own ZIP
    (`<slug>-<section>.zip`) alongside the bundle-wide "Download all"
    (`<slug>.zip`). Both reuse `/api/download/zip` with the section's items.
17. **Per-store errors are surfaced**: an error outcome shows the store, the
    error `kind` and its message (e.g. "No app found", "Could not reach the
    App Store"), so a failure is legible rather than a generic banner.

## 3. Repository Contract

```ts
interface StoreAssetsRepository {
  search(query: SearchQuery): Promise<Result<AppSummary>>;
  getAssets(
    appId: string,
    locale: StoreLocale,
  ): Promise<Result<AppAssetBundle>>;
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
- `search` fetches a small page (`num: 5` on Play, `limit: 5` on the App
  Store); the repository keeps the first hit (rule 6).
- `GplayDataSource.search` wraps the call in `retry` (one extra attempt on an
  empty result, ~800ms backoff) and a `TtlCache` (non-empty results cached a
  few minutes, keyed by `term|country|lang`). Both counter Google's
  rate-limiting; see `core/utils/{retry,ttl-cache}.ts`.
- `ItunesDataSource.app` queries by `id` for a numeric id and by `bundleId`
  otherwise; an empty lookup throws so the repository maps it to NotFound.
- **Screenshot fallback**: Apple's Lookup/Search API populates
  `screenshotUrls`/`ipadScreenshotUrls` inconsistently — for some apps it
  returns empty arrays even though the listing has screenshots (e.g. Gentler
  Streak). When the lookup yields no phone *and* no iPad screenshots,
  `ItunesDataSource.app` fetches the listing page (`trackViewUrl`) and parses
  its embedded `serialized-server-data` JSON for the phone/iPad shelves
  (`appstore-page-screenshots.ts`). This is still Apple's own data over the
  built-in `fetch` (no third-party scraper). The fallback never throws: any
  fetch/parse failure leaves the (icon-only) bundle intact. Apps whose lookup
  already has screenshots skip the extra request entirely.

## 5. Use Cases

| Use case                | `call(...)`                                     | Delegates to                     |
| ----------------------- | ----------------------------------------------- | -------------------------------- |
| `SearchAppUseCase`      | `(SearchQuery) → Result<AppSummary>`            | `repo.search`                    |
| `GetAppAssetsUseCase`   | `(appId, StoreLocale) → Result<AppAssetBundle>` | `repo.getAssets`                 |
| `GrabAppAssetsUseCase`  | `(GrabRequest) → Result<AppAssetBundle>`        | the two above (single store)     |
| `GrabFromStoresUseCase` | `(MultiGrabRequest) → Result<MultiGrabResult>`  | per-store `GrabAppAssetsUseCase` |

`GrabAppAssetsUseCase` orchestrates rule 7/8 for one store: use `appId`
directly when present; otherwise validate the term, search, then fetch
assets. A failed search short-circuits (assets are not fetched). The use
cases are store-agnostic: `di.ts` injects the store-specific repository.

`GrabFromStoresUseCase` orchestrates rule 14: it validates that a term or id
is present (else `ValidationError`), then runs the per-store grabbers — both
stores for a name search, the one selected store for an id search — in
parallel. It never fails as a whole once input is valid; each store's
`Result<AppAssetBundle>` is captured as a `StoreGrabOutcome { store, result }`
inside `MultiGrabResult { outcomes }`.

## 6. API Contract

| Route               | Method | Input                        | Success                             | Errors                        |
| ------------------- | ------ | ---------------------------- | ----------------------------------- | ----------------------------- |
| `/api/assets`       | POST   | JSON `AssetsRequestBody`     | `{ results: StoreGrabResultDTO[] }` | 400 (no input / bad JSON)     |
| `/api/download`     | GET    | `?url=&name=`                | image stream (attachment)           | 400 (bad/disallowed url), 502 |
| `/api/download/zip` | POST   | JSON `{ zipName?, items[] }` | `application/zip` stream            | 400 (empty / >100 items)      |

- `AssetsRequestBody` carries `term?`, `appId?`, optional `store` (`play` |
  `appstore`, used only in id mode; absent/unrecognised → `play`), and
  locale. A name search ignores `store` and resolves both stores. `appId` may
  be a bare id or a pasted store URL; the use case extracts the id and the
  link's store (rules 7/14).
- `POST /api/assets` succeeds (200) with one `StoreGrabResultDTO` per
  resolved store: `{ store, bundle? , error? }` — `bundle` on success,
  `error: { kind, message }` on a per-store failure. The route only returns
  a top-level error envelope for request-level failures (missing input,
  malformed JSON → 400); not-found/network/throttle live inside `results`.
- Error body is the uniform envelope `{ error: { kind, message } }`.
- HTTP status is derived from the error kind by `toHttpStatus`
  (validation→400, notFound→404, network→502, server→500).
- All routes pin `runtime = "nodejs"`.

## 7. UI State Machine

`playGrabberReducer(state, action)` — pure, the Cubit analogue:

```
State: { status, results, errorMessage, request }
status ∈ idle | loading | loaded | error

idle ──submit(request)──▶ loading        (clears results + error, stores request)
loading ──loaded(results)─▶ loaded        (keeps request; results = per-store outcomes)
loading ──error(message)──▶ error         (request-level failure only; clears results)
(any) ──submit──▶ loading
(any) ──reset──▶ idle (initial state)
```

`usePlayGrabber` is the only React binding: it dispatches `submit`,
performs `POST /api/assets`, and dispatches `loaded` with the `results`
array (or `error` for a request-level failure). The search form shows the
store toggle (Google Play / App Store) **only in id mode**; a name search
omits it and queries both stores. The id field also accepts a **pasted store
link** (not just a bare id): the store toggle auto-switches to the link's
store as you paste, and `parseStoreAppId` extracts the id on submit (a hint
under the field tells the user). **Id mode is the default** because Google
Play's name search is rate-limited and flaky; selecting **name** mode shows
a warning to that effect (it blames Google Play, notes the App Store stays
reliable, and offers a shortcut back to id). The loaded view renders one
panel per result — a sectioned asset panel reading
`bundle.store`/`bundle.listingUrl` on success, or a per-store error banner
on failure. Each panel (success or error) leads with a coloured `StoreBadge`
(brand glyph + name) and a matching left accent stripe so the source store is
unmistakable when both render stacked.

## 8. Edge Cases

| Scenario                                | Expected behavior                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Empty search results (one store)        | that store's outcome is a `notFound` error banner; the other store still renders |
| Name search, only one store has the app | the found store shows assets; the other shows a not-found banner                 |
| Both stores fail a name search          | 200 with two error outcomes; each store's banner is shown                        |
| Play search throttled (empty)           | retried once (~800ms); if still empty → `notFound` outcome, not cached           |
| App id does not exist                   | scraper throws 404 → `NotFoundError` outcome for that store                      |
| Listing with zero images                | `AppAssetBundle` with empty `assets`; UI shows empty state, no ZIP button        |
| iPhone-only App Store app               | no iPad screenshots; icon + iPhone screenshots only                              |
| App Store lookup returns no screenshots | listing page is parsed for phone/iPad shelves; if it also has none → icon only   |
| Play app with tablet screenshots        | merged phone+tablet list is split by measured aspect into phone & tablet blocks  |
| App Store id given as numeric or bundle | both resolve (data source routes by shape)                                       |
| Play / App Store URL pasted as the id   | id + store extracted from the link; the link's store overrides the toggle        |
| Store URL with no extractable id        | passed through trimmed and unchanged; resolved as a raw id (likely not-found)     |
| Blank/whitespace term                   | `ValidationError` (rule 8)                                                       |
| Unknown country/lang                    | defaults to `us`/`en` (rule 9)                                                   |
| Unknown `store` value (id mode)         | defaults to `play` (rule 14)                                                     |
| One asset fails to download in the ZIP  | that asset is skipped; the ZIP still completes                                   |
| Network failure reaching a store        | `NetworkError` → 502                                                             |
| Malformed JSON body on `/api/assets`    | `ValidationError` → 400                                                          |

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
