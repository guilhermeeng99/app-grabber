import { NetworkError, NotFoundError, ServerError } from "@/core/errors";
import { err, ok } from "@/core/result";
import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  AppSummary,
  SearchQuery,
  StoreLocale,
} from "@/features/play-assets/domain/entities";
import type { PlayAssetsRepository } from "@/features/play-assets/domain/repository";
import { buildAssets } from "@/features/play-assets/data/asset-mapper";
import type { PlayStoreDataSource } from "@/features/play-assets/data/play-store-datasource";

/**
 * Translates the scraper's raw results and thrown errors into the domain
 * `Result` type. This is the only class aware that a scraper exists.
 */
export class PlayAssetsRepositoryImpl implements PlayAssetsRepository {
  constructor(private readonly dataSource: PlayStoreDataSource) {}

  async search(query: SearchQuery): Promise<Result<AppSummary>> {
    try {
      const results = await this.dataSource.search(query);
      const top = results[0];
      if (!top) {
        return err(new NotFoundError(`No app found for "${query.term}".`));
      }
      return ok({
        appId: top.appId,
        title: top.title,
        developer: top.developer,
        icon: top.icon,
      });
    } catch (error) {
      return err(toAppError(error));
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
        assets: buildAssets(app),
      });
    } catch (error) {
      return err(toAppError(error));
    }
  }
}

/**
 * Map a thrown scraper/network error onto the domain hierarchy. The
 * scraper throws a plain `Error` carrying the HTTP status in its message
 * (e.g. "App not found (404)"), so the status is matched textually: 404
 * → NotFound, transport failures → Network, everything else → Server.
 */
function toAppError(error: unknown): NotFoundError | NetworkError | ServerError {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b404\b|not found/i.test(message)) {
    return new NotFoundError("App not found on the Google Play store.");
  }
  if (/network|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch/i.test(message)) {
    return new NetworkError("Could not reach the Google Play store.");
  }
  return new ServerError(message);
}
