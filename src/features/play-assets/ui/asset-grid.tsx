"use client";

import { useState } from "react";
import { slugify } from "@/core/utils/slugify";
import type { ZipItem } from "@/features/play-assets/api/contracts";
import { withLongestSide } from "@/features/play-assets/data/image-url";
import type { AppAssetBundle } from "@/features/play-assets/domain/entities";
import { AssetCard } from "@/features/play-assets/ui/asset-card";
import { useImageSizes } from "@/features/play-assets/ui/use-image-sizes";

const SIZE_OPTIONS = [
  { label: "0.3×", value: 0.3 },
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
] as const;

export function AssetGrid({ bundle }: { bundle: AppAssetBundle }) {
  const [factor, setFactor] = useState(1);
  const [zipping, setZipping] = useState(false);
  const sizes = useImageSizes(bundle.assets.map((asset) => asset.url));

  const count = bundle.assets.length;
  const storeLabel = bundle.store === "appstore" ? "App Store" : "Google Play";

  function scaledUrl(url: string): string {
    const measured = sizes[url];
    const original = measured ? Math.max(measured.w, measured.h) : 0;
    const px = factor === 1 || original === 0 ? 0 : original * factor;
    return withLongestSide(url, px);
  }

  async function downloadZip() {
    if (zipping) return;
    setZipping(true);
    try {
      const items: ZipItem[] = bundle.assets.map((asset) => ({
        url: scaledUrl(asset.url),
        fileName: asset.fileName,
      }));
      const zipName = `${slugify(bundle.title || bundle.appId)}.zip`;
      const response = await fetch("/api/download/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipName, items }),
      });
      if (!response.ok) return;
      triggerBlobDownload(await response.blob(), zipName);
    } finally {
      setZipping(false);
    }
  }

  return (
    <section className="rounded-2xl border border-pale-gray bg-snow-white p-5 shadow-sm sm:p-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold text-midnight-indigo">
            {bundle.title}
          </h2>
          <p className="truncate text-sm text-slate-blue">
            {bundle.developer} ·{" "}
            <a
              href={bundle.listingUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-action-blue underline-offset-2 hover:underline"
            >
              {bundle.appId}
            </a>{" "}
            · {storeLabel}
          </p>
          <p className="mt-1 text-sm text-steel-gray">
            {count} {count === 1 ? "asset" : "assets"} at maximum resolution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SizeSelector value={factor} onChange={setFactor} />
          {count > 0 && (
            <button
              type="button"
              onClick={downloadZip}
              disabled={zipping}
              className="rounded-lg bg-action-blue px-5 py-2.5 font-semibold text-snow-white shadow-sm transition hover:bg-action-blue-hover disabled:opacity-50"
            >
              {zipping ? "Zipping..." : "Download all (ZIP)"}
            </button>
          )}
        </div>
      </header>

      {count === 0 ? (
        <p className="py-10 text-center text-slate-blue">
          This listing exposes no downloadable images.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {bundle.assets.map((asset) => (
            <AssetCard
              key={asset.name}
              asset={asset}
              size={sizes[asset.url]}
              factor={factor}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SizeSelector(props: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full bg-cloud-mist p-1"
      role="group"
      aria-label="Download size"
    >
      {SIZE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          aria-pressed={props.value === option.value}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
            props.value === option.value
              ? "bg-action-blue text-snow-white shadow-sm"
              : "text-slate-blue hover:text-midnight-indigo"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
