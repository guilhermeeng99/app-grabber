import Image from "next/image";
import { withLongestSide } from "@/features/play-assets/data/play-image-url";
import type { AppAsset, AssetKind } from "@/features/play-assets/domain/entities";
import type { PixelSize } from "@/features/play-assets/ui/use-image-sizes";

const KIND_LABEL: Record<AssetKind, string> = {
  icon: "Icon",
  featureGraphic: "Feature graphic",
  screenshot: "Screenshot",
};

interface AssetCardProps {
  asset: AppAsset;
  /** Measured original dimensions, once known. */
  size?: PixelSize;
  /** Global download multiplier (0.3, 0.5, 1). */
  factor: number;
}

/** A single asset preview: resolution badge plus a forced-download button. */
export function AssetCard({ asset, size, factor }: AssetCardProps) {
  const original = size ? Math.max(size.w, size.h) : 0;
  // factor 1 (or not-yet-measured) downloads the untouched original.
  const targetPx = factor === 1 || original === 0 ? 0 : original * factor;
  const downloadUrl = withLongestSide(asset.url, targetPx);
  const downloadHref = `/api/download?url=${encodeURIComponent(
    downloadUrl,
  )}&name=${encodeURIComponent(asset.fileName)}`;
  const factorSuffix = factor === 1 ? "" : ` (${factor}×)`;

  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-pale-gray bg-snow-white shadow-sm transition hover:shadow-sm-2">
      <div className="relative flex h-44 items-center justify-center bg-cloud-mist p-3">
        <Image
          src={asset.url}
          alt={asset.fileName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2"
        />
      </div>

      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-pale-gray px-2 py-0.5 text-xs font-semibold text-glacier-blue">
            {KIND_LABEL[asset.kind]}
          </span>
          <span className="shrink-0 font-mono text-xs text-slate-blue">
            {size ? `${size.w}×${size.h}` : "…"}
          </span>
        </div>

        <span className="truncate font-mono text-xs text-steel-gray">
          {asset.fileName}
        </span>

        <a
          href={downloadHref}
          download={asset.fileName}
          className="mt-auto w-full rounded-lg border border-platinum-tint py-2 text-center text-sm font-semibold text-action-blue transition hover:border-action-blue hover:bg-action-blue/5"
        >
          Download{factorSuffix}
        </a>
      </figcaption>
    </figure>
  );
}
