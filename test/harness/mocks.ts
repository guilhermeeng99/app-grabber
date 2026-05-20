import { vi } from "vitest";
import type { AppStoreDataSource } from "@/features/play-assets/data/app-store-datasource";
import type { PlayStoreDataSource } from "@/features/play-assets/data/play-store-datasource";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";

/**
 * Centralised test doubles — the analogue of financo's
 * test/harness/mocks.dart. Each method is a `vi.fn()`; configure return
 * values per test with `vi.mocked(mock.method).mockResolvedValue(...)`.
 */
export function createDataSourceMock(): PlayStoreDataSource {
  return { search: vi.fn(), app: vi.fn() };
}

export function createAppStoreDataSourceMock(): AppStoreDataSource {
  return { search: vi.fn(), app: vi.fn() };
}

export function createRepositoryMock(): StoreAssetsRepository {
  return { search: vi.fn(), getAssets: vi.fn() };
}
