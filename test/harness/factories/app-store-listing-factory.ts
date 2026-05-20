import type { AppStoreApp } from "@/features/play-assets/data/app-store-datasource";

const MZ = "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/ab/cd/ef";

/**
 * Test data factory for the raw iTunes (App Store) shape (financo rule:
 * never hardcode entities in tests). URLs mirror Apple's mzstatic CDN with
 * the "<w>x<h><crop>.<ext>" size token its resolver rewrites. Defaults are
 * realistic; pass overrides for the fields under test.
 */
export function makeRawAppStoreApp(
  overrides: Partial<AppStoreApp> = {},
): AppStoreApp {
  return {
    id: 310633997,
    appId: "net.whatsapp.WhatsApp",
    title: "WhatsApp Messenger",
    url: "https://apps.apple.com/us/app/whatsapp-messenger/id310633997",
    icon: `${MZ}/icon.png/512x512bb.jpg`,
    developer: "WhatsApp Inc.",
    screenshots: [`${MZ}/s1.png/392x696bb.png`, `${MZ}/s2.png/392x696bb.png`],
    ipadScreenshots: [`${MZ}/ipad1.png/576x768bb.png`],
    appletvScreenshots: [],
    ...overrides,
  };
}

/** The raw iTunes Lookup/Search JSON shape, before `ItunesDataSource` maps it. */
export interface RawItunesResult {
  trackId: number;
  bundleId: string;
  trackName: string;
  trackViewUrl: string;
  artworkUrl512?: string;
  artistName: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  appletvScreenshotUrls?: string[];
}

/**
 * Test data for the raw iTunes JSON a lookup returns (distinct from
 * `makeRawAppStoreApp`, which is the already-mapped domain-facing shape).
 * Defaults carry screenshots; pass empty arrays to exercise the page fallback.
 */
export function makeItunesResult(
  overrides: Partial<RawItunesResult> = {},
): RawItunesResult {
  return {
    trackId: 310633997,
    bundleId: "net.whatsapp.WhatsApp",
    trackName: "WhatsApp Messenger",
    trackViewUrl:
      "https://apps.apple.com/us/app/whatsapp-messenger/id310633997",
    artworkUrl512: `${MZ}/icon.png/512x512bb.jpg`,
    artistName: "WhatsApp Inc.",
    screenshotUrls: [`${MZ}/s1.png/392x696bb.png`],
    ipadScreenshotUrls: [],
    appletvScreenshotUrls: [],
    ...overrides,
  };
}
