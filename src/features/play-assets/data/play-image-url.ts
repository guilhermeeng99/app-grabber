/**
 * Google Play image-resolution helpers. Play images are served from
 * play-lh.googleusercontent.com: with no size suffix they default to
 * ~512px on the longest side; with a suffix like "=w526-h296" they are
 * scaled to that box. The longest-side size is controlled by the "=s<px>"
 * suffix. Apple's scheme is entirely different — see `appstore-image-url.ts`.
 */

/**
 * Force a Play image URL to its maximum resolution: strip any existing
 * size suffix and append "=s0", which returns the original (largest) asset.
 * Ported verbatim from the original CLI.
 */
export function maxRes(url: string): string {
  return url.replace(/=[^/]*$/, "") + "=s0";
}

/**
 * Re-target a Play image URL to a specific longest-side pixel size by
 * replacing its size suffix with `=s<px>`. `px <= 0` returns the original
 * (`=s0`). Google only downscales, so requesting more than the source has
 * returns the source size. Drives the 0.3x/0.5x/1x download-size picker.
 */
export function withLongestSide(url: string, px: number): string {
  const stripped = url.replace(/=[^/]*$/, "");
  return px > 0 ? `${stripped}=s${Math.round(px)}` : `${stripped}=s0`;
}
