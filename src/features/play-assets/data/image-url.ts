import { isAppStoreImageHost } from "@/features/play-assets/data/image-host";
import { withLongestSide as playWithLongestSide } from "@/features/play-assets/data/play-image-url";
import { withLongestSide as appStoreWithLongestSide } from "@/features/play-assets/data/appstore-image-url";

/**
 * Store-agnostic image helpers shared by the UI. Each store encodes image
 * size differently, so resizing dispatches on the URL's host; the UI stays
 * unaware of which store an asset came from.
 */

/** Best-effort image extension from a URL, defaulting to ".png". */
export function extFromUrl(url: string, fallback = ".png"): string {
  const clean = url.split("?")[0]?.split("=")[0] ?? "";
  const match = clean.match(/\.(png|jpe?g|webp|gif)$/i);
  return match ? `.${match[1]!.toLowerCase()}` : fallback;
}

/**
 * Re-target an image URL to a longest-side pixel size, picking the store's
 * resolver by host (App Store CDN vs. everything else → Play). `px <= 0`
 * yields the original (largest) asset.
 */
export function withLongestSide(url: string, px: number): string {
  return isAppStoreImageHost(url)
    ? appStoreWithLongestSide(url, px)
    : playWithLongestSide(url, px);
}
