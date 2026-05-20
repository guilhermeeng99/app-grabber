import type { IAppItemFullDetail } from "google-play-scraper";
import type {
  AppAsset,
  AssetKind,
} from "@/features/play-assets/domain/entities";
import { extFromUrl } from "@/features/play-assets/data/image-url";
import { maxRes } from "@/features/play-assets/data/play-image-url";

/**
 * Build the ordered, max-resolution asset list from a raw Play listing:
 * icon first, then the feature graphic, then screenshots numbered from
 * 01. Missing fields are skipped. Pure and the single source of truth
 * for Play asset naming and ordering — mirrored by `play-asset-mapper.test.ts`.
 */
export function buildAssets(
  app: Pick<IAppItemFullDetail, "icon" | "headerImage" | "screenshots">,
): AppAsset[] {
  const assets: AppAsset[] = [];

  if (app.icon) {
    assets.push(toAsset("icon", "icon", app.icon));
  }
  if (app.headerImage) {
    assets.push(toAsset("featureGraphic", "feature-graphic", app.headerImage));
  }
  (app.screenshots ?? []).forEach((url, index) => {
    const name = `screenshot-${String(index + 1).padStart(2, "0")}`;
    assets.push(toAsset("screenshot", name, url));
  });

  return assets;
}

function toAsset(kind: AssetKind, name: string, rawUrl: string): AppAsset {
  const url = maxRes(rawUrl);
  return { kind, name, fileName: `${name}${extFromUrl(url)}`, url };
}
