import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // google-play-scraper (got + cheerio + dynamic requires) must NOT be
  // bundled: bundling silently breaks its search-page parser (search
  // returns []), though app-by-id still works. Loading it as an external
  // native require fixes name search. (The App Store side uses the official
  // iTunes API via built-in fetch, so it needs no externalisation.)
  serverExternalPackages: ["google-play-scraper"],

  // Stores serve listing assets from these CDNs (Play: one host; App Store:
  // is1-ssl..is5-ssl.mzstatic.com). next/image needs them allow-listed to
  // render the previews; the download routes re-check every host server-side
  // to block SSRF (see image-host.ts > isAllowedImageHost).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "**.mzstatic.com" },
    ],
  },
};

export default nextConfig;
