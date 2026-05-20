# Play Assets Feature Spec

> **Status**: Active
> **Last updated**: 2026-05-20
> **Coverage**: Entities, Business Rules, Repository, Data Source, Use Cases, API, UI State Machine, Edge Cases, Security

The single feature of App Grabber: given an app name or package id and a
store locale, resolve the listing and expose every downloadable image at
its maximum resolution, individually or as a ZIP.

## 1. Entity Contract

### AppAsset

| Field    | Type        | Notes                                                        |
| -------- | ----------- | ------------------------------------------------------------ |
| kind     | `AssetKind` | `icon` \| `featureGraphic` \| `screenshot`                  |
| name     | `string`    | Stable slug: `icon`, `feature-graphic`, `screenshot-01`, …  |
| fileName | `string`    | Download name, e.g. `screenshot-01.png`                      |
| url      | `string`    | Max-resolution URL on `play-lh.googleusercontent.com`        |

### AppSummary (a single search hit)

`appId`, `title`, `developer`, `icon` — all `string`.

### AppAssetBundle (a resolved app)

`appId`, `title`, `developer` (`string`) + `assets: readonly AppAsset[]`.

### StoreLocale / SearchQuery / GrabRequest

- `StoreLocale` = `{ country: string; lang: string }`.
- `SearchQuery` = `StoreLocale` + `{ term: string }`.
- `GrabRequest` = `StoreLocale` + `{ term?: string; appId?: string }`.

## 2. Business Rules

1. **Max resolution**: every image URL is normalised by stripping any
   trailing `=...` size suffix and appending `=s0`, which returns the
   original asset instead of the ~512px default thumbnail (`maxRes`).
2. **Asset ordering**: icon first, then feature graphic, then screenshots
   in listing order.
3. **Screenshot numbering**: `screenshot-NN`, 1-based, zero-padded to two
   digits (`screenshot-01`, …, `screenshot-11`).
4. **Missing assets are skipped**: an absent icon or feature graphic
   produces no entry (no placeholder).
5. **File extension**: derived from the URL (`.png/.jpg/.jpeg/.webp/.gif`),
   defaulting to `.png` when undetectable (Play CDN URLs carry no extension).
6. **Search returns the top match only**: `num: 1`; the first result wins.
7. **Package id skips search**: when `appId` is provided it is used
   directly; `term` is ignored.
8. **Input required**: a request with neither a non-blank `term` nor a
   non-blank `appId` is a `ValidationError`.
9. **Locale defaults**: missing/invalid `country`/`lang` default to `us` /
   `en`; accepted values are two ASCII letters (normalised lowercase).
10. **ZIP file name**: `slugify(title || appId) + ".zip"`, slug capped at
    60 chars.
11. **Download size multiplier**: a global `0.3x / 0.5x / 1x` picker
    rescales downloads through the CDN `=s<px>` suffix, where
    `px = round(longestSide * factor)`; `1x` uses `=s0` (the untouched
    original). `longestSide` comes from the client-measured dimensions.
12. **Per-asset resolution** is measured in the browser by loading the
    original image, and shown on each card as `w×h`.
13. **ZIP** receives the (already size-scaled) URLs + file names from the
    client; the server re-validates every host before fetching (see §9).

## 3. Repository Contract

```ts
interface PlayAssetsRepository {
  search(query: SearchQuery): Promise<Result<AppSummary>>;
  getAssets(appId: string, locale: StoreLocale): Promise<Result<AppAssetBundle>>;
}
```

### Behavior

- **search**: returns the first result mapped to `AppSummary`; empty
  results → `Left(NotFoundError)`.
- **getAssets**: fetches the full listing and builds the asset bundle via
  `buildAssets`.
- **Both**: catch thrown scraper errors and map them onto the domain
  hierarchy — `404`/“not found” → `NotFoundError`, transport failures
  (`ENOTFOUND`/`ETIMEDOUT`/`ECONNRESET`/`ECONNREFUSED`/fetch) →
  `NetworkError`, anything else → `ServerError`.

## 4. Data Source Contract

```ts
interface PlayStoreDataSource {
  search(query: SearchQuery): Promise<IAppItem[]>;
  app(appId: string, locale: StoreLocale): Promise<IAppItemFullDetail>;
}
```

`GplayDataSource` is the live implementation backed by
`google-play-scraper`. It is the **only** module that imports the scraper.
`search` always passes `num: 1`.

## 5. Use Cases

| Use case               | `call(...)`                                  | Delegates to          |
| ---------------------- | -------------------------------------------- | --------------------- |
| `SearchAppUseCase`     | `(SearchQuery) → Result<AppSummary>`         | `repo.search`         |
| `GetAppAssetsUseCase`  | `(appId, StoreLocale) → Result<AppAssetBundle>` | `repo.getAssets`   |
| `GrabAppAssetsUseCase` | `(GrabRequest) → Result<AppAssetBundle>`     | the two above         |

`GrabAppAssetsUseCase` orchestrates rule 7/8: use `appId` directly when
present; otherwise validate the term, search, then fetch assets for the
match. A failed search short-circuits (assets are not fetched).

## 6. API Contract

| Route                    | Method | Input                                  | Success            | Errors                        |
| ------------------------ | ------ | -------------------------------------- | ------------------ | ----------------------------- |
| `/api/assets`            | POST   | JSON `AssetsRequestBody`               | `AppAssetBundle`   | 400 / 404 / 502 / 500         |
| `/api/download`          | GET    | `?url=&name=`                          | image stream (attachment) | 400 (bad/disallowed url), 502 |
| `/api/download/zip`      | POST   | JSON `{ zipName?, items[] }`           | `application/zip` stream | 400 (empty / >100 items)      |

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
performs `POST /api/assets`, and dispatches `loaded`/`error`. The stored
`request` supplies `country`/`lang` to the ZIP link.

## 8. Edge Cases

| Scenario                                  | Expected behavior                                            |
| ----------------------------------------- | ----------------------------------------------------------- |
| Empty search results                      | `NotFoundError` → 404, UI shows the error banner            |
| App id does not exist                     | scraper throws 404 → `NotFoundError`                        |
| Listing with zero images                  | `AppAssetBundle` with empty `assets`; UI shows empty state, no ZIP button |
| Blank/whitespace term                     | `ValidationError` (rule 8)                                  |
| Unknown country/lang                      | defaults to `us`/`en` (rule 9)                              |
| One asset fails to download in the ZIP    | that asset is skipped; the ZIP still completes              |
| Network failure reaching Play             | `NetworkError` → 502                                        |
| Malformed JSON body on `/api/assets`      | `ValidationError` → 400                                     |

## 9. Security

- **SSRF allow-list**: `isAllowedImageHost` permits only
  `https://play-lh.googleusercontent.com`. Both download routes re-check
  every URL before fetching it server-side.
- **ZIP host re-validation**: the ZIP route accepts client-supplied
  (size-scaled) URLs but re-checks every one against the host allow-list
  before fetching, caps the list at 100 items, and sanitizes each file
  name. The allow-list (not the URL source) is what blocks SSRF.
- **Header safety**: download file names are sanitized
  (`sanitizeFileName`) — path separators and CR/LF/quote characters are
  stripped before they reach `Content-Disposition`.
- **No caching of downloads**: download responses set `Cache-Control: no-store`.
