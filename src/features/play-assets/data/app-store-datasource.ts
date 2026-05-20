import type {
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";

/**
 * Project-owned boundary over Apple's public iTunes APIs. We call the
 * official Search and Lookup endpoints directly with the built-in `fetch`
 * (no third-party scraper, so no `request`-chain CVEs); they return the
 * same JSON the App Store app consumes. The App Store counterpart of
 * `PlayStoreDataSource`. Only the two calls Play Grabber needs are exposed.
 */
export interface AppStoreApp {
  /** Numeric track id (used to build the apps.apple.com link). */
  readonly id: number;
  /** Bundle id, e.g. "net.whatsapp.WhatsApp" — our public `appId`. */
  readonly appId: string;
  readonly title: string;
  /** Canonical localized store URL (trackViewUrl). */
  readonly url: string;
  /** Artwork at the largest size the lookup returns (512/100/60). */
  readonly icon: string;
  readonly developer: string;
  readonly screenshots?: string[];
  readonly ipadScreenshots?: string[];
  readonly appletvScreenshots?: string[];
}

export interface AppStoreDataSource {
  search(query: SearchQuery): Promise<AppStoreApp[]>;
  app(appId: string, locale: StoreLocale): Promise<AppStoreApp>;
}

const SEARCH_URL = "https://itunes.apple.com/search";
const LOOKUP_URL = "https://itunes.apple.com/lookup";

/** The subset of an iTunes "software" result we map to `AppStoreApp`. */
interface ItunesResult {
  trackId: number;
  bundleId: string;
  trackName: string;
  trackViewUrl: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  artistName: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  appletvScreenshotUrls?: string[];
}

/** Live implementation backed by the official iTunes Search/Lookup APIs. */
export class ItunesDataSource implements AppStoreDataSource {
  async search(query: SearchQuery): Promise<AppStoreApp[]> {
    const params = new URLSearchParams({
      term: query.term,
      country: query.country,
      lang: query.lang,
      entity: "software",
      limit: "1", // the repository only keeps the top match
    });
    return this.fetchApps(`${SEARCH_URL}?${params}`);
  }

  async app(appId: string, locale: StoreLocale): Promise<AppStoreApp> {
    // Lookup accepts a numeric track id or a bundle id; route by shape so
    // both the "by id" (e.g. 310633997) and resolved-bundle paths work.
    const idField = /^\d+$/.test(appId) ? "id" : "bundleId";
    const params = new URLSearchParams({
      [idField]: appId,
      country: locale.country,
      lang: locale.lang,
      entity: "software",
    });
    const apps = await this.fetchApps(`${LOOKUP_URL}?${params}`);
    if (apps.length === 0) {
      // Match the scraper convention so the repository maps it to NotFound.
      throw new Error("App not found (404)");
    }
    return apps[0]!;
  }

  private async fetchApps(url: string): Promise<AppStoreApp[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes request failed (${response.status})`);
    }
    const body = (await response.json()) as { results?: ItunesResult[] };
    return (body.results ?? []).map(toAppStoreApp);
  }
}

function toAppStoreApp(raw: ItunesResult): AppStoreApp {
  return {
    id: raw.trackId,
    appId: raw.bundleId,
    title: raw.trackName,
    url: raw.trackViewUrl,
    icon: raw.artworkUrl512 ?? raw.artworkUrl100 ?? raw.artworkUrl60 ?? "",
    developer: raw.artistName,
    screenshots: raw.screenshotUrls,
    ipadScreenshots: raw.ipadScreenshotUrls,
    appletvScreenshots: raw.appletvScreenshotUrls,
  };
}
