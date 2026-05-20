# App Grabber

> **Use it now: https://app-grabber.vercel.app** — no install, no sign-up. Just open the link.

App Grabber is a free web tool that downloads a Google Play app's **icon**,
**feature graphic** and **screenshots** in the **highest available resolution**.
Type an app name, preview every asset, and grab exactly what you need.

## Features

- **Search by name or package id**, for any Google Play store country and language.
- **Highest resolution**: every image is fetched at its original size (`=s0`),
  not the small store thumbnail.
- **See each asset's resolution** right on its card.
- **Pick the download size**: 0.3×, 0.5× or 1×.
- **Download one by one, or all at once as a ZIP**.

## How to use

1. Open **https://app-grabber.vercel.app**.
2. Type an app name (e.g. `WhatsApp`), or switch to **By package id**
   (e.g. `com.whatsapp`) for an exact match.
3. Choose a store country and language.
4. Download each asset, or **Download all (ZIP)**.

That is the whole thing. Nothing to install.

## How it works

App Grabber reads the **public** Google Play listing on the server (the browser
cannot, because of CORS), forces each image to its original resolution, and
streams downloads through its own API so cross-origin images save cleanly, both
as single files and as a ZIP. Server fetches are restricted to Google's image
CDN.

## Tech

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Vitest. Feature-first
Clean Architecture with a spec-driven workflow, see [`CLAUDE.md`](CLAUDE.md) and
[`docs/specs/play-assets.md`](docs/specs/play-assets.md).

Hosted on Vercel. Every push to `main` runs the CI gate (lint, test, build),
auto-bumps the version, publishes a GitHub release, and redeploys.

## Run locally (developers)

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npm test`.

## Notes

- Assets belong to their respective developers. App Grabber only fetches the
  public Play Store listing.
- Icons cap at 512×512 (Play Store limit).
- If a name search picks the wrong app, copy the package id from the Play URL
  (`...?id=com.example.app`) and use **By package id**.

---

Made by **Guilherme Passos**.
[GitHub](https://github.com/guilhermeeng99) · [LinkedIn](https://www.linkedin.com/in/guigapassos/)
