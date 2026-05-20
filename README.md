# App Grabber

A website to download a Google Play app's **icon** and **promotional images**
(screenshots + feature graphic) in the **highest available resolution**. Just
type the app name.

> Repo, directory and code symbols keep the original `play-grabber` /
> `play-assets` naming; **App Grabber** is the product name shown to users.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. The Google
Play scraping runs server-side in API route handlers; the browser only talks to
this app's own API.

## Requirements

- [Node.js](https://nodejs.org/) 18.18+ (20+ recommended).

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

## How to use

1. Type an app name (e.g. `WhatsApp`), or switch to **By package id** and enter
   `com.whatsapp` for an exact match.
2. Pick a store country and listing language (for localized screenshots).
3. Each card shows the asset's resolution. Use the **0.3× / 0.5× / 1×** picker
   to choose the download size.
4. Download each asset individually, or **Download all (ZIP)**.

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm start            # Run the production build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Vitest
npm run format       # Prettier
```

## How it works

1. `POST /api/assets` resolves the package id (from the search term, or directly)
   and fetches the listing via `google-play-scraper`.
2. Each image URL is a `play-lh.googleusercontent.com` link. The size suffix
   controls resolution: `=s0` returns the original (largest) asset; `=s<px>`
   sets the longest side (the basis for the 0.3×/0.5×/1× picker).
3. `GET /api/download` proxies a single image with `Content-Disposition:
   attachment` (a cross-origin `<a download>` would otherwise just navigate).
4. `POST /api/download/zip` takes the chosen image URLs and streams them as a
   single ZIP via `archiver`.

Both download routes only fetch Google's image CDN (host allow-list) to
prevent SSRF.

## Architecture

Feature-first Clean Architecture (see [`CLAUDE.md`](CLAUDE.md)) with a
spec-driven workflow (see [`docs/specs/play-assets.md`](docs/specs/play-assets.md)):

```
src/
├── app/                      # routes (pages) + API route handlers
├── core/                     # Result, errors, utils
└── features/play-assets/
    ├── domain/               # entities, repository interface, use cases
    ├── data/                 # scraper datasource, repository impl, mappers
    ├── ui/                   # components, hook, pure reducer
    ├── api/                  # wire DTOs
    └── di.ts                 # composition root
test/                         # mirrors src/ (Vitest) + harness/
```

## Deploy

Optimised for [Vercel](https://vercel.com): import the repo and deploy. The
scraper routes require the Node.js runtime (already pinned in each handler), not
the Edge runtime.

## Notes

- Scrapes the **public** Play Store listing; assets are whatever the developer
  uploaded. Icons cap at 512×512 (Play Store limit).
- If a name search picks the wrong app, copy the package id from the Play URL
  (`...?id=com.example.app`) and use **By package id**.
- The original CLI lives in `index.js` for reference; the web app supersedes it.
