/**
 * Force a Google user-content image URL to its maximum resolution.
 * Play images are served from play-lh.googleusercontent.com. With no
 * size suffix they default to ~512px on the longest side; with a suffix
 * like "=w526-h296" they are scaled to that box. Stripping any existing
 * suffix and appending "=s0" returns the original (largest) asset.
 * Ported verbatim from the original CLI.
 */
export function maxRes(url: string): string {
  return url.replace(/=[^/]*$/, "") + "=s0";
}

/**
 * Re-target a Play image URL to a specific longest-side pixel size by
 * replacing its size suffix with `=s<px>`. `px <= 0` returns the original
 * (`=s0`). Google only downscales, so requesting more than the source has
 * returns the source size (the basis for the 0.5x/1x/2x picker).
 */
export function withLongestSide(url: string, px: number): string {
  const stripped = url.replace(/=[^/]*$/, "");
  return px > 0 ? `${stripped}=s${Math.round(px)}` : `${stripped}=s0`;
}

/** Best-effort image extension from a URL, defaulting to ".png". */
export function extFromUrl(url: string, fallback = ".png"): string {
  const clean = url.split("?")[0]?.split("=")[0] ?? "";
  const match = clean.match(/\.(png|jpe?g|webp|gif)$/i);
  return match ? `.${match[1]!.toLowerCase()}` : fallback;
}

// Google serves every Play listing image from this single CDN host.
const ALLOWED_IMAGE_HOSTS = new Set(["play-lh.googleusercontent.com"]);

/**
 * SSRF guard for the download proxy routes: server-side fetches are
 * restricted to Google Play's image CDN over HTTPS. Anything else — a
 * different host, plain HTTP, or a malformed URL — is rejected so a
 * crafted `url` parameter cannot make the server fetch internal
 * resources.
 */
export function isAllowedImageHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}
