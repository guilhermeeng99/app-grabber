import type { Result } from "@/core/result";
import type {
  AppAssetBundle,
  StoreLocale,
} from "@/features/play-assets/domain/entities";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";

/** Fetch every downloadable asset for an exact app id. */
export class GetAppAssetsUseCase {
  constructor(private readonly repository: StoreAssetsRepository) {}

  call(appId: string, locale: StoreLocale): Promise<Result<AppAssetBundle>> {
    return this.repository.getAssets(appId, locale);
  }
}
