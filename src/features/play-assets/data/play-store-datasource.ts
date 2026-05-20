import gplay from "google-play-scraper";
import type { IAppItem, IAppItemFullDetail } from "google-play-scraper";
import { retry } from "@/core/utils/retry";
import { TtlCache } from "@/core/utils/ttl-cache";
import type {
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";

/**
 * Project-owned boundary over `google-play-scraper`. Only the two calls
 * Play Grabber needs are exposed; the rest of the library stays hidden so
 * no other module depends on it. Swappable for a fake in tests.
 */
export interface PlayStoreDataSource {
  search(query: SearchQuery): Promise<IAppItem[]>;
  app(appId: string, locale: StoreLocale): Promise<IAppItemFullDetail>;
}

// Cache successful searches briefly; retry empty ones once. Both counter
// Google's rate-limiting of the unauthenticated scraper.
const SEARCH_TTL_MS = 5 * 60 * 1000;
const SEARCH_RETRY_DELAY_MS = 800;
// Fetch >1: Google's search-page parser intermittently returns [] for num:1,
// so a slightly larger page is far more reliable. The repository keeps [0].
const SEARCH_PAGE_SIZE = 5;

/** Live implementation backed by the Google Play scraper. */
export class GplayDataSource implements PlayStoreDataSource {
  private readonly searchCache = new TtlCache<IAppItem[]>(SEARCH_TTL_MS);

  async search(query: SearchQuery): Promise<IAppItem[]> {
    const key = `${query.term}|${query.country}|${query.lang}`;
    const cached = this.searchCache.get(key);
    if (cached) return cached;

    // Retry once on an empty result (likely a throttled response), but never
    // cache an empty list — a throttled miss must be retried, not memoised.
    const results = await retry(() => this.fetchSearch(query), {
      attempts: 2,
      delayMs: SEARCH_RETRY_DELAY_MS,
      shouldRetry: (items) => items.length === 0,
    });
    if (results.length > 0) this.searchCache.set(key, results);
    return results;
  }

  private fetchSearch(query: SearchQuery): Promise<IAppItem[]> {
    return gplay.search({
      term: query.term,
      num: SEARCH_PAGE_SIZE,
      country: query.country,
      lang: query.lang,
    });
  }

  app(appId: string, locale: StoreLocale): Promise<IAppItemFullDetail> {
    return gplay.app({
      appId,
      country: locale.country,
      lang: locale.lang,
    });
  }
}
