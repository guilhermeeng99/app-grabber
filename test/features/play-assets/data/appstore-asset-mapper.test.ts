import { describe, expect, it } from "vitest";
import { buildAssets } from "@/features/play-assets/data/appstore-asset-mapper";
import { makeRawAppStoreApp } from "../../../harness/factories/app-store-listing-factory";

describe("buildAssets (App Store)", () => {
  it("orders icon, iPhone screenshots, then iPad screenshots", () => {
    const assets = buildAssets(makeRawAppStoreApp());

    expect(assets.map((a) => a.name)).toEqual([
      "icon",
      "screenshot-01",
      "screenshot-02",
      "screenshot-ipad-01",
    ]);
    expect(assets.map((a) => a.kind)).toEqual([
      "icon",
      "screenshot",
      "screenshot",
      "screenshot",
    ]);
    expect(assets.map((a) => a.section)).toEqual([
      "icon",
      "phone",
      "phone",
      "tablet",
    ]);
  });

  it("never produces a feature graphic (the App Store has none)", () => {
    const kinds = buildAssets(makeRawAppStoreApp()).map((a) => a.kind);
    expect(kinds).not.toContain("featureGraphic");
  });

  it("rewrites every URL to a max-resolution mzstatic size token", () => {
    const raw = makeRawAppStoreApp({
      icon: "https://is1-ssl.mzstatic.com/x/icon.png/512x512bb.jpg",
      screenshots: ["https://is1-ssl.mzstatic.com/x/s.png/392x696bb.png"],
      ipadScreenshots: [],
    });
    const assets = buildAssets(raw);

    // square icon scales 1:1 to the max box
    expect(assets[0]?.url).toBe(
      "https://is1-ssl.mzstatic.com/x/icon.png/9999x9999bb.jpg",
    );
    // portrait screenshot keeps aspect: longest side hits the max box
    expect(assets[1]?.url).toMatch(/\/\d+x9999bb\.png$/);
  });

  it("skips a missing icon and ignores Apple TV screenshots", () => {
    const assets = buildAssets(
      makeRawAppStoreApp({
        icon: "",
        screenshots: ["https://is1-ssl.mzstatic.com/x/s.png/392x696bb.png"],
        ipadScreenshots: [],
        appletvScreenshots: [
          "https://is1-ssl.mzstatic.com/x/tv.png/1920x1080bb.png",
        ],
      }),
    );

    expect(assets).toHaveLength(1);
    expect(assets[0]?.name).toBe("screenshot-01");
  });

  it("derives the download file name with an extension", () => {
    const assets = buildAssets(
      makeRawAppStoreApp({ ipadScreenshots: [], screenshots: [] }),
    );
    expect(assets[0]?.fileName).toBe("icon.jpg");
  });
});
