/**
 * App Store image-resolution helpers. Apple serves artwork/screenshots
 * from *.mzstatic.com with the target dimensions baked into the last path
 * segment, e.g. ".../392x696bb.png" — WIDTHxHEIGHT, a crop code, an
 * extension, and sometimes a "-<quality>" suffix. Apple's image service
 * only downscales, so requesting a box larger than the source returns the
 * original.
 *
 * Both helpers rewrite WIDTH/HEIGHT while preserving the segment's aspect
 * ratio and its crop code, so screenshots are never letterboxed. Google's
 * "=s<px>" trick does not apply here. URLs that do not match the Apple
 * pattern are returned unchanged.
 */

// Well above any real source: Apple caps to the original, so this yields
// the largest available asset.
const MAX_LONGEST_SIDE = 9999;

// Last path segment: "<w>x<h><crop?><-quality?>.<ext>".
const SIZE_SEGMENT = /\/(\d+)x(\d+)([a-z]*)(-\d+)?\.(png|jpe?g|webp)(?=$|\?)/i;

/** Force an Apple image URL to (effectively) its source resolution. */
export function maxRes(url: string): string {
  return withLongestSide(url, 0);
}

/**
 * Re-target an Apple image URL so its longest side is `px`, scaling the
 * other side to keep aspect. `px <= 0` requests the source (largest)
 * resolution. A "0x0" directive already means "source", so it is left as is.
 */
export function withLongestSide(url: string, px: number): string {
  return url.replace(
    SIZE_SEGMENT,
    (
      match,
      w: string,
      h: string,
      crop: string,
      quality: string | undefined,
      ext: string,
    ) => {
      const width = Number(w);
      const height = Number(h);
      if (!width || !height) return match; // "0x0…" already denotes the source
      const target = px > 0 ? px : MAX_LONGEST_SIDE;
      const scale = target / Math.max(width, height);
      const nextW = Math.max(1, Math.round(width * scale));
      const nextH = Math.max(1, Math.round(height * scale));
      return `/${nextW}x${nextH}${crop}${quality ?? ""}.${ext}`;
    },
  );
}
