"use client";

import type { AppAsset } from "@/features/play-assets/domain/entities";
import { AssetCard } from "@/features/play-assets/ui/asset-card";
import type { PixelSize } from "@/features/play-assets/ui/use-image-sizes";

interface SectionGroupProps {
  label: string;
  assets: AppAsset[];
  /** Measured dimensions by URL, shared across the whole bundle. */
  sizes: Record<string, PixelSize>;
  /** Global download multiplier (0.3, 0.5, 1). */
  factor: number;
  /** True while this section's ZIP is being built. */
  zipping: boolean;
  onDownload: () => void;
}

/**
 * One titled section block (Icon / Banner / Phone / Tablet): a header with the
 * asset count and an optional section-only ZIP, then the card grid. The ZIP
 * button is hidden for single-asset sections (icon, banner) where the per-card
 * download already covers it.
 */
export function SectionGroup({
  label,
  assets,
  sizes,
  factor,
  zipping,
  onDownload,
}: SectionGroupProps) {
  return (
    <div className="rounded-xl border border-pale-gray bg-cloud-mist/40 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-midnight-indigo">
          {label}
          <span className="rounded-full bg-pale-gray px-2 py-0.5 text-xs font-semibold text-slate-blue">
            {assets.length}
          </span>
        </h3>
        {assets.length > 1 && (
          <button
            type="button"
            onClick={onDownload}
            disabled={zipping}
            className="rounded-lg border border-platinum-tint px-3 py-1.5 text-sm font-semibold text-action-blue transition hover:border-action-blue hover:bg-action-blue/5 disabled:opacity-50"
          >
            {zipping ? "Zipping..." : "Download (ZIP)"}
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.name}
            asset={asset}
            size={sizes[asset.url]}
            factor={factor}
          />
        ))}
      </div>
    </div>
  );
}
