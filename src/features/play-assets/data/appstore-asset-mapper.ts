import type { AppStoreApp } from "@/features/play-assets/data/app-store-datasource";
import type {
  AppAsset,
  AssetKind,
  AssetSection,
} from "@/features/play-assets/domain/entities";
import { extFromUrl } from "@/features/play-assets/data/image-url";
import { maxRes } from "@/features/play-assets/data/appstore-image-url";

/**
 * Build the ordered, max-resolution asset list from a raw App Store
 * listing: icon first, then iPhone screenshots (section `phone`), then iPad
 * screenshots (section `tablet`, kept distinct so file names never collide).
 * The App Store has no feature-graphic equivalent, so no `banner` is produced.
 * Missing fields are skipped. Pure — mirrored by `appstore-asset-mapper.test.ts`.
 */
export function buildAssets(
  app: Pick<AppStoreApp, "icon" | "screenshots" | "ipadScreenshots">,
): AppAsset[] {
  const assets: AppAsset[] = [];

  if (app.icon) {
    assets.push(toAsset("icon", "icon", "icon", app.icon));
  }
  (app.screenshots ?? []).forEach((url, index) => {
    assets.push(
      toAsset("screenshot", "phone", `screenshot-${pad(index + 1)}`, url),
    );
  });
  (app.ipadScreenshots ?? []).forEach((url, index) => {
    assets.push(
      toAsset("screenshot", "tablet", `screenshot-ipad-${pad(index + 1)}`, url),
    );
  });

  return assets;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toAsset(
  kind: AssetKind,
  section: AssetSection,
  name: string,
  rawUrl: string,
): AppAsset {
  const url = maxRes(rawUrl);
  return { kind, section, name, fileName: `${name}${extFromUrl(url)}`, url };
}
