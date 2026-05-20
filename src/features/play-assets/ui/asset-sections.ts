import type {
  AppAsset,
  AssetSection,
} from "@/features/play-assets/domain/entities";
import type { PixelSize } from "@/features/play-assets/ui/use-image-sizes";

/** A non-empty group of assets sharing one section, with its display label. */
export interface AssetSectionGroup {
  readonly section: AssetSection;
  readonly label: string;
  readonly assets: AppAsset[];
}

// Aspect ratio (shorter ÷ longer side) at or above which a screenshot is
// treated as a tablet shot. Phones sit ~0.46–0.56, tablets ~0.70–0.75, so a
// 0.65 cut cleanly separates the common portrait case. Orientation-independent
// (uses the side ratio), so landscape shots classify the same way.
const TABLET_MIN_RATIO = 0.65;

/**
 * Reclassify tablet-shaped screenshots out of the `phone` section using their
 * measured dimensions. Google Play merges phone and tablet screenshots into
 * one list with no device tag (unlike the App Store, which splits them at the
 * source), so the rendered shape is the only available signal. Intended for
 * Play bundles; the App Store is already split server-side and should not be
 * passed through this. Screenshots not yet measured stay `phone` until their
 * size is known. Heuristic by nature — unusual aspect ratios may misclassify.
 */
export function classifyTabletScreenshots(
  assets: readonly AppAsset[],
  sizes: Record<string, PixelSize>,
): AppAsset[] {
  return assets.map((asset) => {
    if (asset.kind !== "screenshot" || asset.section !== "phone") return asset;
    const size = sizes[asset.url];
    if (!size || !size.w || !size.h) return asset;
    const ratio = Math.min(size.w, size.h) / Math.max(size.w, size.h);
    return ratio >= TABLET_MIN_RATIO ? { ...asset, section: "tablet" } : asset;
  });
}

// Render order of the section blocks; labels shown in each block's header.
const SECTION_ORDER: readonly AssetSection[] = [
  "icon",
  "banner",
  "phone",
  "tablet",
];

const SECTION_LABEL: Record<AssetSection, string> = {
  icon: "Icon",
  banner: "Banner",
  phone: "Phone screenshots",
  tablet: "Tablet screenshots",
};

/**
 * Group a bundle's assets into ordered, non-empty section blocks for the UI.
 * Pure (no React) so it is unit-tested directly; asset order within a section
 * is preserved from the mapper. Empty sections are dropped, so a store that
 * lacks a section (Play has no tablet, the App Store has no banner) simply
 * renders fewer blocks.
 */
export function groupAssetsBySection(
  assets: readonly AppAsset[],
): AssetSectionGroup[] {
  return SECTION_ORDER.flatMap((section) => {
    const inSection = assets.filter((asset) => asset.section === section);
    if (inSection.length === 0) return [];
    return [{ section, label: SECTION_LABEL[section], assets: inSection }];
  });
}
