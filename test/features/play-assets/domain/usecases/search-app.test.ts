import { describe, expect, it, vi } from "vitest";
import { ok } from "@/core/result";
import type { PlayAssetsRepository } from "@/features/play-assets/domain/repository";
import { SearchAppUseCase } from "@/features/play-assets/domain/usecases/search-app";
import { createRepositoryMock } from "../../../../harness/mocks";
import { makeAppSummary } from "../../../../harness/factories/app-asset-factory";

describe("SearchAppUseCase", () => {
  it("delegates to repository.search with the query", async () => {
    const repository: PlayAssetsRepository = createRepositoryMock();
    vi.mocked(repository.search).mockResolvedValue(ok(makeAppSummary()));
    const query = { term: "x", country: "us", lang: "en" };

    await new SearchAppUseCase(repository).call(query);

    expect(repository.search).toHaveBeenCalledWith(query);
  });
});
