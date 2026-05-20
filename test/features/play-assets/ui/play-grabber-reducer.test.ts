import { describe, expect, it } from "vitest";
import {
  initialGrabState,
  playGrabberReducer,
} from "@/features/play-assets/ui/play-grabber-reducer";
import { makeAppAssetBundle } from "../../../harness/factories/app-asset-factory";

const request = { term: "x", country: "us", lang: "en" };

describe("playGrabberReducer", () => {
  it("submit → loading, clearing any previous bundle/error and storing the request", () => {
    const next = playGrabberReducer(initialGrabState, { type: "submit", request });

    expect(next.status).toBe("loading");
    expect(next.bundle).toBeNull();
    expect(next.errorMessage).toBeNull();
    expect(next.request).toEqual(request);
  });

  it("loaded → loaded with the bundle, keeping the request", () => {
    const loading = playGrabberReducer(initialGrabState, {
      type: "submit",
      request,
    });
    const bundle = makeAppAssetBundle();

    const next = playGrabberReducer(loading, { type: "loaded", bundle });

    expect(next.status).toBe("loaded");
    expect(next.bundle).toBe(bundle);
    expect(next.request).toEqual(request);
  });

  it("error → error with the message and no bundle", () => {
    const loading = playGrabberReducer(initialGrabState, {
      type: "submit",
      request,
    });

    const next = playGrabberReducer(loading, { type: "error", message: "boom" });

    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("boom");
    expect(next.bundle).toBeNull();
  });

  it("reset → initial state", () => {
    const loaded = playGrabberReducer(initialGrabState, {
      type: "loaded",
      bundle: makeAppAssetBundle(),
    });

    expect(playGrabberReducer(loaded, { type: "reset" })).toEqual(
      initialGrabState,
    );
  });
});
