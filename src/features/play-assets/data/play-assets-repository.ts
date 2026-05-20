import { err, ok } from "@/core/result";
import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  AppSummary,
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";
import { buildAssets } from "@/features/play-assets/data/play-asset-mapper";
import {
  toAppError,
  topSummary,
} from "@/features/play-assets/data/store-result";
import type { PlayStoreDataSource } from "@/features/play-assets/data/play-store-datasource";

const STORE_NAME = "Google Play";

/**
 * Google Play implementation of `StoreAssetsRepository`. Translates the
 * scraper's raw results and thrown errors into the domain `Result`; the
 * only class aware that `google-play-scraper` exists.
 */
export class PlayAssetsRepositoryImpl implements StoreAssetsRepository {
  constructor(private readonly dataSource: PlayStoreDataSource) {}

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
        store: "play",
        listingUrl: `https://play.google.com/store/apps/details?id=${app.appId}`,
        assets: buildAssets(app),
      });
    } catch (error) {
      return err(toAppError(error, STORE_NAME));
    }
  }
}
