"use client";

import { useState } from "react";
import { slugify } from "@/core/utils/slugify";
import type {
  StoreGrabResultDTO,
  ZipItem,
} from "@/features/play-assets/api/contracts";
import { withLongestSide } from "@/features/play-assets/data/image-url";
import type {
  AppAsset,
  AppAssetBundle,
  StoreId,
} from "@/features/play-assets/domain/entities";
import { SectionGroup } from "@/features/play-assets/ui/asset-section";
import { groupAssetsBySection } from "@/features/play-assets/ui/asset-sections";
import { downloadZip } from "@/features/play-assets/ui/download-zip";
import { useImageSizes } from "@/features/play-assets/ui/use-image-sizes";

const STORE_LABEL: Record<StoreId, string> = {
  play: "Google Play",
  appstore: "App Store",
};

const SIZE_OPTIONS = [
  { label: "0.3×", value: 0.3 },
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
] as const;

/** One store's outcome: a sectioned asset panel, or a per-store error banner. */
export function ResultPanel({ result }: { result: StoreGrabResultDTO }) {
  if (!result.bundle) {
    return (
      <StoreErrorBanner
        store={result.store}
        kind={result.error?.kind}
        message={result.error?.message}
      />
    );
  }
  return <BundlePanel bundle={result.bundle} />;
}

function BundlePanel({ bundle }: { bundle: AppAssetBundle }) {
  const [factor, setFactor] = useState(1);
  const [zippingKey, setZippingKey] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const sizes = useImageSizes(bundle.assets.map((asset) => asset.url));

  const groups = groupAssetsBySection(bundle.assets);
  const count = bundle.assets.length;
  const slug = slugify(bundle.title || bundle.appId);

  function scaledUrl(url: string): string {
    const measured = sizes[url];
    const original = measured ? Math.max(measured.w, measured.h) : 0;
    const px = factor === 1 || original === 0 ? 0 : original * factor;
    return withLongestSide(url, px);
  }

  async function runZip(
    key: string,
    zipName: string,
    assets: readonly AppAsset[],
  ) {
    if (zippingKey) return;
    setZipError(null);
    setZippingKey(key);
    try {
      const items: ZipItem[] = assets.map((asset) => ({
        url: scaledUrl(asset.url),
        fileName: asset.fileName,
      }));
      await downloadZip(zipName, items);
    } catch {
      setZipError("Could not build the ZIP. Please try again.");
    } finally {
      setZippingKey(null);
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
            · {STORE_LABEL[bundle.store]}
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
              onClick={() => runZip("all", `${slug}.zip`, bundle.assets)}
              disabled={zippingKey !== null}
              className="rounded-lg bg-action-blue px-5 py-2.5 font-semibold text-snow-white shadow-sm transition hover:bg-action-blue-hover disabled:opacity-50"
            >
              {zippingKey === "all" ? "Zipping..." : "Download all (ZIP)"}
            </button>
          )}
        </div>
      </header>

      {zipError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {zipError}
        </p>
      )}

      {count === 0 ? (
        <p className="py-10 text-center text-slate-blue">
          This listing exposes no downloadable images.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <SectionGroup
              key={group.section}
              label={group.label}
              assets={group.assets}
              sizes={sizes}
              factor={factor}
              zipping={zippingKey === group.section}
              onDownload={() =>
                runZip(
                  group.section,
                  `${slug}-${group.section}.zip`,
                  group.assets,
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** A legible per-store failure: the store, the error kind, and its message. */
function StoreErrorBanner({
  store,
  kind,
  message,
}: {
  store: StoreId;
  kind?: string;
  message?: string;
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-red-800">{STORE_LABEL[store]}</h2>
        {kind && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            {kind}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-red-700">
        {message ?? "Something went wrong."}
      </p>
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
