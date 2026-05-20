import type { Result } from "@/core/result";
import type {
  AppSummary,
  SearchQuery,
} from "@/features/play-assets/domain/entities";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";

/** Resolve the top app match for a search term. */
export class SearchAppUseCase {
  constructor(private readonly repository: StoreAssetsRepository) {}

  call(query: SearchQuery): Promise<Result<AppSummary>> {
    return this.repository.search(query);
  }
}
