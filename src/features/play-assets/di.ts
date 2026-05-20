import { GplayDataSource } from "@/features/play-assets/data/play-store-datasource";
import { PlayAssetsRepositoryImpl } from "@/features/play-assets/data/play-assets-repository";
import type { PlayAssetsRepository } from "@/features/play-assets/domain/repository";
import { GetAppAssetsUseCase } from "@/features/play-assets/domain/usecases/get-app-assets";
import { GrabAppAssetsUseCase } from "@/features/play-assets/domain/usecases/grab-app-assets";
import { SearchAppUseCase } from "@/features/play-assets/domain/usecases/search-app";

/**
 * Tiny composition root — the analogue of financo's get_it container,
 * scoped to this feature. Lazily wires the live scraper-backed
 * repository and caches it for the lifetime of the server process
 * (`registerLazySingleton`). Use cases are cheap, so they are created
 * per call (`registerFactory`).
 */
let repository: PlayAssetsRepository | null = null;

export function getPlayAssetsRepository(): PlayAssetsRepository {
  repository ??= new PlayAssetsRepositoryImpl(new GplayDataSource());
  return repository;
}

export function getGrabAppAssetsUseCase(): GrabAppAssetsUseCase {
  const repo = getPlayAssetsRepository();
  return new GrabAppAssetsUseCase(
    new SearchAppUseCase(repo),
    new GetAppAssetsUseCase(repo),
  );
}
