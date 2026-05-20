import { describe, expect, it, vi } from "vitest";
import { ok } from "@/core/result";
import type { PlayAssetsRepository } from "@/features/play-assets/domain/repository";
import { GetAppAssetsUseCase } from "@/features/play-assets/domain/usecases/get-app-assets";
import { createRepositoryMock } from "../../../../harness/mocks";
import { makeAppAssetBundle } from "../../../../harness/factories/app-asset-factory";

describe("GetAppAssetsUseCase", () => {
  it("delegates to repository.getAssets with the id and locale", async () => {
    const repository: PlayAssetsRepository = createRepositoryMock();
    vi.mocked(repository.getAssets).mockResolvedValue(ok(makeAppAssetBundle()));
    const locale = { country: "br", lang: "pt" };

    await new GetAppAssetsUseCase(repository).call("com.x", locale);

    expect(repository.getAssets).toHaveBeenCalledWith("com.x", locale);
  });
});
