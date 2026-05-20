import { describe, expect, it } from "vitest";
import {
  classifyTabletScreenshots,
  groupAssetsBySection,
} from "@/features/play-assets/ui/asset-sections";
import { makeAppAsset } from "../../../harness/factories/app-asset-factory";

const PHONE = { w: 1620, h: 2880 }; // ratio 0.56 → phone
const TABLET = { w: 2064, h: 2752 }; // ratio 0.75 → tablet

describe("groupAssetsBySection", () => {
  it("orders sections icon, banner, phone, tablet and drops empty ones", () => {
    const groups = groupAssetsBySection([
      makeAppAsset({ section: "tablet", name: "screenshot-ipad-01" }),
      makeAppAsset({ section: "phone", name: "screenshot-01" }),
      makeAppAsset({ section: "icon", kind: "icon", name: "icon" }),
    ]);

    // banner has no assets here, so it is absent
    expect(groups.map((g) => g.section)).toEqual(["icon", "phone", "tablet"]);
  });

  it("preserves the mapper's asset order within a section", () => {
    const [group] = groupAssetsBySection([
      makeAppAsset({ section: "phone", name: "screenshot-02" }),
      makeAppAsset({ section: "phone", name: "screenshot-01" }),
    ]);

    expect(group?.assets.map((a) => a.name)).toEqual([
      "screenshot-02",
      "screenshot-01",
    ]);
  });

  it("labels each section for display", () => {
    const groups = groupAssetsBySection([
      makeAppAsset({
        section: "banner",
        kind: "featureGraphic",
        name: "feature-graphic",
      }),
    ]);

    expect(groups[0]?.label).toBe("Banner");
  });

  it("returns no groups when there are no assets", () => {
    expect(groupAssetsBySection([])).toEqual([]);
  });
});

describe("classifyTabletScreenshots", () => {
  it("moves a tablet-shaped screenshot into the tablet section", () => {
    const asset = makeAppAsset({ url: "shot-tablet" });
    const [out] = classifyTabletScreenshots([asset], { "shot-tablet": TABLET });
    expect(out?.section).toBe("tablet");
  });

  it("keeps a phone-shaped screenshot in the phone section", () => {
    const asset = makeAppAsset({ url: "shot-phone" });
    const [out] = classifyTabletScreenshots([asset], { "shot-phone": PHONE });
    expect(out?.section).toBe("phone");
  });

  it("classifies the same regardless of orientation (uses the side ratio)", () => {
    const asset = makeAppAsset({ url: "shot-landscape-tablet" });
    const [out] = classifyTabletScreenshots([asset], {
      "shot-landscape-tablet": { w: TABLET.h, h: TABLET.w },
    });
    expect(out?.section).toBe("tablet");
  });

  it("leaves screenshots whose size is not yet measured as phone", () => {
    const asset = makeAppAsset({ url: "shot-unmeasured" });
    const [out] = classifyTabletScreenshots([asset], {});
    expect(out?.section).toBe("phone");
  });

  it("never touches icons or banners even when measured tablet-shaped", () => {
    const icon = makeAppAsset({ kind: "icon", section: "icon", url: "icon" });
    const banner = makeAppAsset({
      kind: "featureGraphic",
      section: "banner",
      url: "banner",
    });
    const out = classifyTabletScreenshots([icon, banner], {
      icon: TABLET,
      banner: TABLET,
    });
    expect(out.map((a) => a.section)).toEqual(["icon", "banner"]);
  });

  it("splits a merged Play list into phone and tablet blocks once grouped", () => {
    const assets = [
      makeAppAsset({ name: "screenshot-01", url: "p1" }),
      makeAppAsset({ name: "screenshot-02", url: "t1" }),
    ];
    const groups = groupAssetsBySection(
      classifyTabletScreenshots(assets, { p1: PHONE, t1: TABLET }),
    );
    expect(groups.map((g) => g.section)).toEqual(["phone", "tablet"]);
  });
});
