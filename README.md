# App Grabber

> **Use it now: https://app-grabber.vercel.app** — no install, no sign-up. Just open the link.

App Grabber is a free web tool that downloads an app's **icon**,
**feature graphic** and **screenshots** in the **highest available resolution**,
from **Google Play or the App Store**. Type an app name, preview every asset,
and grab exactly what you need.

## Features

- **Two stores**: Google Play and the App Store, picked with a toggle.
- **Search by name or id**, for any store country and language.
- **Highest resolution**: every image is fetched at its original size, not the
  small store thumbnail. App Store listings include both iPhone and iPad
  screenshots.
- **See each asset's resolution** right on its card.
- **Pick the download size**: 0.3×, 0.5× or 1×.
- **Download one by one, or all at once as a ZIP**.

## How to use

1. Open **https://app-grabber.vercel.app**.
2. Pick the store: **Google Play** or **App Store**.
3. Type an app name (e.g. `WhatsApp`), or switch to the **By id** tab for an
   exact match (`com.whatsapp` on Play; `310633997` or
   `net.whatsapp.WhatsApp` on the App Store).
4. Choose a store country and language.
5. Download each asset, or **Download all (ZIP)**.

That is the whole thing. Nothing to install.

## How it works

App Grabber reads the **public** store listing on the server (the browser
cannot, because of CORS), forces each image to its original resolution, and
streams downloads through its own API so cross-origin images save cleanly, both
as single files and as a ZIP. Server fetches are restricted to the stores'
image CDNs (Google's and Apple's).

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
  public store listing.
- Icon size caps at the store's source (about 512×512 on Play, up to 1024×1024
  on the App Store).
- If a name search picks the wrong app, switch to the **By id** tab: on Play
  copy the package id from the URL (`...?id=com.example.app`); on the App Store
  copy the numeric id from the URL (`.../id310633997`) or paste the bundle id.

---

Made by **Guilherme Passos**.
[GitHub](https://github.com/guilhermeeng99) · [LinkedIn](https://www.linkedin.com/in/guigapassos/)
