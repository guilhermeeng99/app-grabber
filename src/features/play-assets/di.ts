import { GplayDataSource } from "@/features/play-assets/data/play-store-datasource";
import { PlayAssetsRepositoryImpl } from "@/features/play-assets/data/play-assets-repository";
import { ItunesDataSource } from "@/features/play-assets/data/app-store-datasource";
import { AppStoreAssetsRepositoryImpl } from "@/features/play-assets/data/app-store-repository";
import type { StoreId } from "@/features/play-assets/domain/entities";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";
import { GetAppAssetsUseCase } from "@/features/play-assets/domain/usecases/get-app-assets";
import { GrabAppAssetsUseCase } from "@/features/play-assets/domain/usecases/grab-app-assets";
import { GrabFromStoresUseCase } from "@/features/play-assets/domain/usecases/grab-from-stores";
import { SearchAppUseCase } from "@/features/play-assets/domain/usecases/search-app";

/**
 * Tiny composition root — the analogue of financo's get_it container,
 * scoped to this feature. Lazily wires one scraper-backed repository per
 * store and caches it for the lifetime of the server process
 * (`registerLazySingleton`) — this is what keeps the Play datasource's search
 * cache alive across requests. Use cases are cheap, so they are created per
 * call (`registerFactory`).
 */
const repositories: Partial<Record<StoreId, StoreAssetsRepository>> = {};

export function getStoreAssetsRepository(
  store: StoreId,
): StoreAssetsRepository {
  return (repositories[store] ??=
    store === "appstore"
      ? new AppStoreAssetsRepositoryImpl(new ItunesDataSource())
      : new PlayAssetsRepositoryImpl(new GplayDataSource()));
}

export function getGrabAppAssetsUseCase(
  store: StoreId = "play",
): GrabAppAssetsUseCase {
  const repo = getStoreAssetsRepository(store);
  return new GrabAppAssetsUseCase(
    new SearchAppUseCase(repo),
    new GetAppAssetsUseCase(repo),
  );
}

/**
 * Multi-store entry used by `/api/assets`: a name search fans out to every
 * store, an id search targets the one selected store (the use case decides).
 */
export function getGrabFromStoresUseCase(): GrabFromStoresUseCase {
  return new GrabFromStoresUseCase({
    play: getGrabAppAssetsUseCase("play"),
    appstore: getGrabAppAssetsUseCase("appstore"),
  });
}
