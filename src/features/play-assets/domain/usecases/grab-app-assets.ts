import { ValidationError } from "@/core/errors";
import { err } from "@/core/result";
import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  GrabRequest,
} from "@/features/play-assets/domain/entities";
import type { GetAppAssetsUseCase } from "@/features/play-assets/domain/usecases/get-app-assets";
import type { SearchAppUseCase } from "@/features/play-assets/domain/usecases/search-app";

/**
 * Top-level entry used by the API: resolve a package id — directly when
 * given, otherwise by searching the term — and return its asset bundle.
 * Orchestration only; the actual fetching is delegated to the two
 * single-purpose use cases (financo rule: use cases execute logic,
 * higher-level use cases orchestrate).
 */
export class GrabAppAssetsUseCase {
  constructor(
    private readonly searchApp: SearchAppUseCase,
    private readonly getAppAssets: GetAppAssetsUseCase,
  ) {}

  async call(request: GrabRequest): Promise<Result<AppAssetBundle>> {
    const locale = { country: request.country, lang: request.lang };

    const appId = request.appId?.trim();
    if (appId) return this.getAppAssets.call(appId, locale);

    const term = request.term?.trim();
    if (!term) {
      return err(new ValidationError("Provide an app name or a package id."));
    }

    const found = await this.searchApp.call({ term, ...locale });
    if (!found.ok) return found;

    return this.getAppAssets.call(found.value.appId, locale);
  }
}
