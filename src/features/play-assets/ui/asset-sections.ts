import type {
  AppAsset,
  AssetSection,
} from "@/features/play-assets/domain/entities";

/** A non-empty group of assets sharing one section, with its display label. */
export interface AssetSectionGroup {
  readonly section: AssetSection;
  readonly label: string;
  readonly assets: AppAsset[];
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
