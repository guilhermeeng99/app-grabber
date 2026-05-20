import type { AppStoreApp } from "@/features/play-assets/data/app-store-datasource";
import type {
  AppAsset,
  AssetKind,
} from "@/features/play-assets/domain/entities";
import { extFromUrl } from "@/features/play-assets/data/image-url";
import { maxRes } from "@/features/play-assets/data/appstore-image-url";

/**
 * Build the ordered, max-resolution asset list from a raw App Store
 * listing: icon first, then iPhone screenshots, then iPad screenshots
 * (kept distinct so file names never collide). The App Store has no
 * feature-graphic equivalent, so none is produced. Missing fields are
 * skipped. Pure — mirrored by `appstore-asset-mapper.test.ts`.
 */
export function buildAssets(
  app: Pick<AppStoreApp, "icon" | "screenshots" | "ipadScreenshots">,
): AppAsset[] {
  const assets: AppAsset[] = [];

  if (app.icon) {
    assets.push(toAsset("icon", "icon", app.icon));
  }
  (app.screenshots ?? []).forEach((url, index) => {
    assets.push(toAsset("screenshot", `screenshot-${pad(index + 1)}`, url));
  });
  (app.ipadScreenshots ?? []).forEach((url, index) => {
    assets.push(toAsset("screenshot", `screenshot-ipad-${pad(index + 1)}`, url));
  });

  return assets;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toAsset(kind: AssetKind, name: string, rawUrl: string): AppAsset {
  const url = maxRes(rawUrl);
  return { kind, name, fileName: `${name}${extFromUrl(url)}`, url };
}
