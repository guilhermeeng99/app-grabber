# App Grabber (play-grabber) - Project Conventions

A website that searches an app on **Google Play or the App Store** and
downloads its icon and promotional images (feature graphic + screenshots)
in the highest available resolution. Built with **Next.js (App Router) +
TypeScript**. The two stores share one domain, use cases and UI; they differ
only inside `data/` (one scraper, mapper and image resolver each), selected
per request in `di.ts`.

These conventions are the TypeScript/Next port of the financo project's
Clean-Architecture + spec-driven discipline.

---

## Architecture

**Clean Architecture** with feature-first organization:

```
src/
├── app/          # Next.js App Router: pages + API route handlers
│   └── api/      # route handlers (the HTTP boundary) + _lib helpers
├── core/         # Shared: Result, errors, utils (framework-agnostic)
└── features/     # Feature modules (each with domain/data/ui)
    └── play-assets/
        ├── domain/   # entities, repository interface, use cases
        ├── data/     # scraper datasource, repository impl, mappers
        ├── ui/       # components, hook, reducer (the "presentation")
        ├── api/      # wire DTOs shared by routes + client
        └── di.ts     # composition root (get_it analogue)
```

Each feature follows:

- `domain/` — entities, repository interfaces, use cases (no I/O, no framework)
- `data/` — datasources, repository implementations, external-lib wrappers
- `ui/` — React components, hooks, and the pure state reducer

Dependency direction is always **ui/api → domain ← data**. The domain
imports nothing outward.

---

## Code Style

- Functions: 5–25 lines. Split if longer.
- Files: ideally under 400 lines.
- One responsibility per function/module (SRP).
- Prefer small, composable components over large ones.

### Naming

- Names must be specific and intention-revealing.
- Avoid generic names like `data`, `manager`, `handler`, `utils` (as a dumping ground).
- Files are `kebab-case.ts`; types/classes `PascalCase`; functions/vars `camelCase`.

### Control Flow

- Prefer early returns over nested conditionals.
- Maximum 2 levels of indentation.

---

## Comments

- Write **WHY**, not WHAT.
- Preserve important context and decisions.
- Do not remove meaningful comments during refactors.
- Exported APIs include intent; non-obvious ones include a usage note.

---

## Key Technologies

| Aspect              | Detail                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Framework**       | Next.js 15 (App Router), React 19, TypeScript (strict)         |
| **Scraping**        | `google-play-scraper` (Play) + official iTunes Search/Lookup API via `fetch` (App Store); each wrapped behind a DS |
| **Styling**         | Tailwind CSS v4                                                |
| **ZIP**             | `archiver` (streamed from the route handler)                   |
| **Error handling**  | `Result<T, E>` + sealed `AppError` hierarchy (Either analogue) |
| **State**           | `useReducer` over a pure reducer (Cubit analogue)              |
| **DI**              | tiny composition root in `features/<f>/di.ts`                  |
| **Testing**         | Vitest (node env) — domain/data/reducer logic                  |
| **Linting**         | ESLint (`next/core-web-vitals`, `next/typescript`) + Prettier  |

---

## Commands

```bash
npm run dev          # Local dev server
npm run build        # Production build (must pass)
npm run typecheck    # tsc --noEmit — zero errors
npm run lint         # ESLint — zero errors/warnings
npm test             # Vitest — all tests pass
npm run format       # Prettier write
```

> Commands are RTK-wrapped by the Claude Code hook (e.g. `rtk npm test`).

---

## Post-Change Checklist

After every code change:

1. `npm run typecheck` — **zero** errors.
2. `npm run lint` — **zero** errors and warnings.
3. `npm test` — all tests pass.
4. Never add `// eslint-disable` / `// @ts-expect-error` without a clear justification comment.

---

## Spec-Driven Development

Every feature MUST have a spec at `docs/specs/<feature>.md` before writing
new code or tests.

### Workflow

1. Write or update the spec (entity contracts, numbered business rules, state machines).
2. Write tests based on the spec.
3. Implement or modify code to pass the tests.
4. Update the spec if requirements change.

### Spec Structure

- Entity contract (fields, types, invariants)
- Business rules (numbered, testable)
- Repository / data-source contracts
- Use cases
- API contract (endpoints, status codes)
- UI state machine
- Edge cases & security

---

## Testing Rules

- Every use case and every pure data helper has tests.
- Every bug fix includes a regression test.
- Tests follow F.I.R.S.T (Fast, Independent, Repeatable, Self-validating, Timely).

### Test Structure

- Tests live under `test/`, mirroring `src/` (e.g. `src/core/utils/slugify.ts` → `test/core/utils/slugify.test.ts`).
- Use factories for test data — never hardcode entities inline.
- Mock at boundaries: the **data source** for the repository, the **repository** for use cases.
- The UI reducer is tested as a pure function (no React/DOM needed).

### Harness

Test infrastructure lives in `test/harness/`:

- `mocks.ts` — centralized test doubles (`vi.fn()`-backed).
- `helpers.ts` — `expectOk` / `expectErr` Result assertions.
- `factories/` — test-data factories per shape (raw scraper + domain).

---

## Dependencies

- Depend on abstractions, not implementations.
- Inject dependencies via constructor; wire them in `di.ts`.
- External libraries (the scraper, archiver) are wrapped behind project-owned interfaces — only `data/` and route handlers may import them.

---

## Code Conventions

- Fallible boundaries return `Result<T, AppError>`; they never throw across a layer.
- Errors are a sealed hierarchy (`ValidationError`, `NotFoundError`, `NetworkError`, `ServerError`), each with a `kind` mapped to an HTTP status by `toHttpStatus`.
- Use cases are single-method classes exposing `call(...)`.
- Entities are `readonly` interfaces; no classes in the domain.
- Use the `@/` path alias for cross-module imports; relative imports only within the same folder cluster and from `test/` into `test/harness/`.
- Prefer `import type { … }` for type-only imports (enforced by lint).

---

## State Management

- The UI state lives in `play-grabber-reducer.ts` as a pure
  `(state, action) => state` function — the Cubit analogue. It is the
  single source of truth for the search → loading → loaded/error machine.
- `use-play-grabber.ts` is the only React binding; it dispatches reducer
  actions and performs the `fetch`. Components contain **no** business logic.
- State is immutable; every transition returns a new object.

---

## API & Security

- Route handlers are the HTTP boundary: parse/validate input, call a use
  case, and translate the `Result` via `jsonResult`. Keep them thin.
- All scraper-backed routes set `export const runtime = "nodejs"` (the
  scraper cannot run on the Edge runtime).
- `google-play-scraper` is listed in `serverExternalPackages` (next.config):
  bundling it silently breaks its search-page parser (name search returns
  no results) while app-by-id keeps working. Do not remove it. The App Store
  side calls Apple's official iTunes Search/Lookup API with built-in `fetch`
  (no third-party scraper, so no `request`-chain CVEs), needing no
  externalisation.
- **SSRF guard**: the download proxy and ZIP routes only fetch hosts on
  the allow-list (`isAllowedImageHost` in `image-host.ts`) — HTTPS on the
  Play CDN or a subdomain of `mzstatic.com`, matched by suffix so
  look-alikes like `mzstatic.com.evil.com` are rejected. The ZIP route takes
  client-supplied (size-scaled) URLs but re-validates every host, caps the
  item count, and sanitizes file names, so the allow-list is what prevents
  SSRF.
- Download responses set `Content-Disposition: attachment` and
  `Cache-Control: no-store`; file names are sanitized before reaching headers.

---

## Legacy

The original CLI (`index.js`) is kept for reference only and is excluded
from the TypeScript build and lint. The canonical logic now lives in
`src/features/play-assets/`.
