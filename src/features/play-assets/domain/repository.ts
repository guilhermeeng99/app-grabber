import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  AppSummary,
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";

/**
 * Boundary the rest of the app depends on. The Google Play scraper lives
 * behind this interface (financo rule: external libraries are wrapped by
 * project-owned abstractions), so use cases never import the scraper and
 * can be tested against an in-memory fake.
 */
export interface PlayAssetsRepository {
  /** Resolve the single best-matching app for a search term. */
  search(query: SearchQuery): Promise<Result<AppSummary>>;

  /** Fetch the full listing for an exact package id and build its assets. */
  getAssets(appId: string, locale: StoreLocale): Promise<Result<AppAssetBundle>>;
}
