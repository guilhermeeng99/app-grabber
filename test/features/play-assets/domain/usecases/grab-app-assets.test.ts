import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/core/errors";
import { err, ok } from "@/core/result";
import type { StoreAssetsRepository } from "@/features/play-assets/domain/repository";
import { GetAppAssetsUseCase } from "@/features/play-assets/domain/usecases/get-app-assets";
import { GrabAppAssetsUseCase } from "@/features/play-assets/domain/usecases/grab-app-assets";
import { SearchAppUseCase } from "@/features/play-assets/domain/usecases/search-app";
import { createRepositoryMock } from "../../../../harness/mocks";
import {
  makeAppAssetBundle,
  makeAppSummary,
} from "../../../../harness/factories/app-asset-factory";
import { expectErr, expectOk } from "../../../../harness/helpers";

describe("GrabAppAssetsUseCase", () => {
  let repository: StoreAssetsRepository;
  let grab: GrabAppAssetsUseCase;

  beforeEach(() => {
    repository = createRepositoryMock();
    grab = new GrabAppAssetsUseCase(
      new SearchAppUseCase(repository),
      new GetAppAssetsUseCase(repository),
    );
  });

  it("uses the package id directly and skips search", async () => {
    vi.mocked(repository.getAssets).mockResolvedValue(
      ok(makeAppAssetBundle({ appId: "com.direct" })),
    );

    const bundle = expectOk(
      await grab.call({ appId: "com.direct", country: "us", lang: "en" }),
    );

    expect(bundle.appId).toBe("com.direct");
    expect(repository.search).not.toHaveBeenCalled();
    expect(repository.getAssets).toHaveBeenCalledWith("com.direct", {
      country: "us",
      lang: "en",
    });
  });

  it("searches by term, then fetches assets for the match", async () => {
    vi.mocked(repository.search).mockResolvedValue(
      ok(makeAppSummary({ appId: "com.found" })),
    );
    vi.mocked(repository.getAssets).mockResolvedValue(
      ok(makeAppAssetBundle({ appId: "com.found" })),
    );

    const bundle = expectOk(
      await grab.call({ term: "found", country: "br", lang: "pt" }),
    );

    expect(repository.search).toHaveBeenCalledWith({
      term: "found",
      country: "br",
      lang: "pt",
    });
    expect(repository.getAssets).toHaveBeenCalledWith("com.found", {
      country: "br",
      lang: "pt",
    });
    expect(bundle.appId).toBe("com.found");
  });

  it("returns a validation error when neither term nor id is given", async () => {
    const error = expectErr(await grab.call({ country: "us", lang: "en" }));
    expect(error.kind).toBe("validation");
    expect(repository.search).not.toHaveBeenCalled();
  });

  it("treats a blank term as missing input", async () => {
    const error = expectErr(
      await grab.call({ term: "   ", country: "us", lang: "en" }),
    );
    expect(error.kind).toBe("validation");
  });

  it("propagates a failed search without fetching assets", async () => {
    vi.mocked(repository.search).mockResolvedValue(
      err(new NotFoundError("nope")),
    );

    const error = expectErr(
      await grab.call({ term: "ghost", country: "us", lang: "en" }),
    );

    expect(error.kind).toBe("notFound");
    expect(repository.getAssets).not.toHaveBeenCalled();
  });
});
