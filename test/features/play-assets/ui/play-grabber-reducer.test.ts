import { describe, expect, it } from "vitest";
import type { StoreGrabResultDTO } from "@/features/play-assets/api/contracts";
import {
  initialGrabState,
  playGrabberReducer,
} from "@/features/play-assets/ui/play-grabber-reducer";
import { makeAppAssetBundle } from "../../../harness/factories/app-asset-factory";

const request = { term: "x", country: "us", lang: "en" };

function makeResults(): StoreGrabResultDTO[] {
  return [
    { store: "play", bundle: makeAppAssetBundle({ store: "play" }) },
    { store: "appstore", error: { kind: "notFound", message: "No app found" } },
  ];
}

describe("playGrabberReducer", () => {
  it("submit → loading, clearing previous results/error and storing the request", () => {
    const next = playGrabberReducer(initialGrabState, {
      type: "submit",
      request,
    });

    expect(next.status).toBe("loading");
    expect(next.results).toBeNull();
    expect(next.errorMessage).toBeNull();
    expect(next.request).toEqual(request);
  });

  it("loaded → loaded with the per-store results, keeping the request", () => {
    const loading = playGrabberReducer(initialGrabState, {
      type: "submit",
      request,
    });
    const results = makeResults();

    const next = playGrabberReducer(loading, { type: "loaded", results });

    expect(next.status).toBe("loaded");
    expect(next.results).toBe(results);
    expect(next.request).toEqual(request);
  });

  it("error → error with the message and no results", () => {
    const loading = playGrabberReducer(initialGrabState, {
      type: "submit",
      request,
    });

    const next = playGrabberReducer(loading, {
      type: "error",
      message: "boom",
    });

    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("boom");
    expect(next.results).toBeNull();
  });

  it("reset → initial state", () => {
    const loaded = playGrabberReducer(initialGrabState, {
      type: "loaded",
      results: makeResults(),
    });

    expect(playGrabberReducer(loaded, { type: "reset" })).toEqual(
      initialGrabState,
    );
  });
});
