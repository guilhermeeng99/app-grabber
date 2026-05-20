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
    screenshots: [
      `${MZ}/s1.png/392x696bb.png`,
      `${MZ}/s2.png/392x696bb.png`,
    ],
    ipadScreenshots: [`${MZ}/ipad1.png/576x768bb.png`],
    appletvScreenshots: [],
    ...overrides,
  };
}
