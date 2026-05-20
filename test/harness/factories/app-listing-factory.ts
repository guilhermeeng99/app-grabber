import type { IAppItem, IAppItemFullDetail } from "google-play-scraper";

/**
 * Test data factories for the raw scraper shapes (financo rule: never
 * hardcode entities in tests). Defaults are realistic; pass overrides for
 * the fields under test.
 */
export function makeRawSearchItem(overrides: Partial<IAppItem> = {}): IAppItem {
  return {
    url: "https://play.google.com/store/apps/details?id=com.example.app",
    appId: "com.example.app",
    title: "Example App",
    summary: "An example app",
    developer: "Example Dev",
    developerId: "Example+Dev",
    icon: "https://play-lh.googleusercontent.com/icon=w240-h480",
    score: 4.5,
    scoreText: "4.5",
    priceText: "Free",
    free: true,
    ...overrides,
  };
}

export function makeRawApp(
  overrides: Partial<IAppItemFullDetail> = {},
): IAppItemFullDetail {
  return {
    ...makeRawSearchItem(),
    description: "An example app",
    descriptionHTML: "<p>An example app</p>",
    installs: "1,000+",
    minInstalls: 1000,
    maxInstalls: 2000,
    ratings: 100,
    reviews: 50,
    histogram: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 },
    price: 0,
    currency: "USD",
    available: true,
    offersIAP: false,
    IAPRange: "",
    size: "10M",
    androidVersion: "5.0",
    androidVersionText: "5.0 and up",
    developerInternalID: "1234567890",
    developerEmail: "dev@example.com",
    developerWebsite: "https://example.com",
    developerAddress: "123 Example St",
    developerLegalName: "",
    developerLegalEmail: "",
    developerLegalAddress: "",
    developerLegalPhoneNumber: "",
    genre: "Tools",
    genreId: "TOOLS",
    categories: [{ name: "Tools", id: "TOOLS" }],
    icon: "https://play-lh.googleusercontent.com/icon=w240-h480",
    headerImage: "https://play-lh.googleusercontent.com/header=w1024-h500",
    screenshots: [
      "https://play-lh.googleusercontent.com/shot1=w300-h600",
      "https://play-lh.googleusercontent.com/shot2=w300-h600",
    ],
    video: "",
    videoImage: "",
    contentRating: "Everyone",
    contentRatingDescription: "",
    adSupported: false,
    released: "Jan 1, 2020",
    updated: 1600000000000,
    version: "1.0.0",
    recentChanges: "",
    comments: [],
    hasEarlyAccess: false,
    preregister: false,
    isAvailableInPlayPass: false,
    ...overrides,
  };
}
