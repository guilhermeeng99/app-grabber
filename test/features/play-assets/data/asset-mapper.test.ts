import { describe, expect, it } from "vitest";
import { buildAssets } from "@/features/play-assets/data/asset-mapper";
import { makeRawApp } from "../../../harness/factories/app-listing-factory";

const CDN = "https://play-lh.googleusercontent.com";

describe("buildAssets", () => {
  it("orders icon, then feature graphic, then numbered screenshots", () => {
    const assets = buildAssets(
      makeRawApp({
        icon: `${CDN}/icon=w512`,
        headerImage: `${CDN}/header=w1024`,
        screenshots: [`${CDN}/s1=w300`, `${CDN}/s2=w300`],
      }),
    );

    expect(assets.map((a) => a.name)).toEqual([
      "icon",
      "feature-graphic",
      "screenshot-01",
      "screenshot-02",
    ]);
    expect(assets.map((a) => a.kind)).toEqual([
      "icon",
      "featureGraphic",
      "screenshot",
      "screenshot",
    ]);
  });

  it("normalises every URL to maximum resolution", () => {
    const assets = buildAssets(
      makeRawApp({ icon: `${CDN}/icon=w512-h512`, headerImage: "", screenshots: [] }),
    );
    expect(assets[0]?.url).toBe(`${CDN}/icon=s0`);
  });

  it("skips a missing icon and feature graphic", () => {
    const assets = buildAssets(
      makeRawApp({ icon: "", headerImage: "", screenshots: [`${CDN}/s1=w300`] }),
    );
    expect(assets).toHaveLength(1);
    expect(assets[0]?.name).toBe("screenshot-01");
  });

  it("pads screenshot numbers to two digits", () => {
    const screenshots = Array.from({ length: 11 }, (_, i) => `${CDN}/s${i}=w1`);
    const names = buildAssets(
      makeRawApp({ icon: "", headerImage: "", screenshots }),
    ).map((a) => a.name);

    expect(names[0]).toBe("screenshot-01");
    expect(names[10]).toBe("screenshot-11");
  });

  it("derives the download file name with an extension", () => {
    const assets = buildAssets(
      makeRawApp({ icon: `${CDN}/icon=w1`, headerImage: "", screenshots: [] }),
    );
    expect(assets[0]?.fileName).toBe("icon.png");
  });
});
