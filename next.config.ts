import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // google-play-scraper (got + cheerio + dynamic requires) must NOT be
  // bundled: bundling silently breaks its search-page parser (search
  // returns []), though app-by-id still works. Loading it as an external
  // native require fixes name search.
  serverExternalPackages: ["google-play-scraper"],

  // Google Play serves every listing asset (icon, feature graphic,
  // screenshots) from this host. next/image needs it allow-listed to
  // render the previews; the download routes re-check it server-side to
  // block SSRF (see play-image-url.ts > isAllowedImageHost).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
