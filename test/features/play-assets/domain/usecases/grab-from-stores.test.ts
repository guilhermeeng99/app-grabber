import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/core/errors";
import { err, ok } from "@/core/result";
import type { GrabAppAssetsUseCase } from "@/features/play-assets/domain/usecases/grab-app-assets";
import { GrabFromStoresUseCase } from "@/features/play-assets/domain/usecases/grab-from-stores";
import { makeAppAssetBundle } from "../../../../harness/factories/app-asset-factory";
import { expectErr, expectOk } from "../../../../harness/helpers";

function makeGrabber(): GrabAppAssetsUseCase {
  return { call: vi.fn() } as unknown as GrabAppAssetsUseCase;
}

const locale = { country: "us", lang: "en" };

describe("GrabFromStoresUseCase", () => {
  let play: GrabAppAssetsUseCase;
  let appstore: GrabAppAssetsUseCase;
  let useCase: GrabFromStoresUseCase;

  beforeEach(() => {
    play = makeGrabber();
    appstore = makeGrabber();
    useCase = new GrabFromStoresUseCase({ play, appstore });
  });

  it("fans a name search out to both stores, in order", async () => {
    vi.mocked(play.call).mockResolvedValue(
      ok(makeAppAssetBundle({ store: "play" })),
    );
    vi.mocked(appstore.call).mockResolvedValue(
      ok(makeAppAssetBundle({ store: "appstore" })),
    );

    const result = expectOk(
      await useCase.call({ term: "whatsapp", ...locale }),
    );

    expect(result.outcomes.map((o) => o.store)).toEqual(["play", "appstore"]);
    expect(play.call).toHaveBeenCalledWith({ term: "whatsapp", ...locale });
    expect(appstore.call).toHaveBeenCalledWith({ term: "whatsapp", ...locale });
  });

  it("captures a per-store failure without affecting the other store", async () => {
    vi.mocked(play.call).mockResolvedValue(
      ok(makeAppAssetBundle({ store: "play" })),
    );
    vi.mocked(appstore.call).mockResolvedValue(err(new NotFoundError("nope")));

    const result = expectOk(
      await useCase.call({ term: "android-only", ...locale }),
    );
    const [playOutcome, appstoreOutcome] = result.outcomes;

    expect(playOutcome?.result.ok).toBe(true);
    expect(appstoreOutcome?.result.ok).toBe(false);
  });

  it("an id search targets only the selected store", async () => {
    vi.mocked(appstore.call).mockResolvedValue(
      ok(makeAppAssetBundle({ store: "appstore" })),
    );

    const result = expectOk(
      await useCase.call({ appId: "310633997", store: "appstore", ...locale }),
    );

    expect(result.outcomes.map((o) => o.store)).toEqual(["appstore"]);
    expect(appstore.call).toHaveBeenCalledWith({
      appId: "310633997",
      ...locale,
    });
    expect(play.call).not.toHaveBeenCalled();
  });

  it("an id search defaults to Play when no store is given", async () => {
    vi.mocked(play.call).mockResolvedValue(ok(makeAppAssetBundle()));

    const result = expectOk(await useCase.call({ appId: "com.x", ...locale }));

    expect(result.outcomes.map((o) => o.store)).toEqual(["play"]);
    expect(play.call).toHaveBeenCalledWith({ appId: "com.x", ...locale });
  });

  it("rejects a request with neither a term nor an id", async () => {
    const error = expectErr(await useCase.call({ ...locale }));
    expect(error.kind).toBe("validation");
    expect(play.call).not.toHaveBeenCalled();
    expect(appstore.call).not.toHaveBeenCalled();
  });

  it("treats blank term and id as missing input", async () => {
    const error = expectErr(
      await useCase.call({ term: "  ", appId: "  ", ...locale }),
    );
    expect(error.kind).toBe("validation");
  });
});
