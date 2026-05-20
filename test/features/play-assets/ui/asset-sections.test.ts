import { describe, expect, it } from "vitest";
import { groupAssetsBySection } from "@/features/play-assets/ui/asset-sections";
import { makeAppAsset } from "../../../harness/factories/app-asset-factory";

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
