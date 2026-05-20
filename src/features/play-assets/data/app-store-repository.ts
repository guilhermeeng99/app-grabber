import { err, ok } from "@/core/result";
import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  AppSummary,
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";
import { buildAssets } from "@/features/play-assets/data/appstore-asset-mapper";
import { toAppError, topSummary } from "@/features/play-assets/data/store-result";
import type { AppStoreDataSource } from "@/features/play-assets/data/app-store-datasource";

const STORE_NAME = "the App Store";

/**
 * App Store implementation of `StoreAssetsRepository`. Translates the
 * iTunes API's raw results and thrown errors into the domain `Result`; the
 * only class aware of how App Store data is fetched.
 */
export class AppStoreAssetsRepositoryImpl implements StoreAssetsRepository {
  constructor(private readonly dataSource: AppStoreDataSource) {}

  async search(query: SearchQuery): Promise<Result<AppSummary>> {
    try {
      return topSummary(await this.dataSource.search(query), query.term);
    } catch (error) {
      return err(toAppError(error, STORE_NAME));
    }
  }

  async getAssets(
    appId: string,
    locale: StoreLocale,
  ): Promise<Result<AppAssetBundle>> {
    try {
      const app = await this.dataSource.app(appId, locale);
      return ok({
        appId: app.appId,
        title: app.title,
        developer: app.developer,
        store: "appstore",
        // trackViewUrl is the canonical listing URL; fall back to the
        // numeric-id form if the lookup omitted it.
        listingUrl: app.url || `https://apps.apple.com/app/id${app.id}`,
        assets: buildAssets(app),
      });
    } catch (error) {
      return err(toAppError(error, STORE_NAME));
    }
  }
}
