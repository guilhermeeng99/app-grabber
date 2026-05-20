import gplay from "google-play-scraper";
import type { IAppItem, IAppItemFullDetail } from "google-play-scraper";
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

/** Live implementation backed by the Google Play scraper. */
export class GplayDataSource implements PlayStoreDataSource {
  search(query: SearchQuery): Promise<IAppItem[]> {
    // num: 1 — the repository only keeps the top match.
    return gplay.search({
      term: query.term,
      num: 1,
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
