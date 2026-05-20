import { isAppStoreImageHost } from "@/features/play-assets/data/image-host";

/**
 * Screenshot fallback for the App Store. Apple's iTunes Lookup/Search API
 * populates `screenshotUrls` inconsistently — some listings return empty
 * arrays even though the web page shows screenshots. The product page embeds
 * the same data the App Store app consumes inside a `serialized-server-data`
 * JSON blob, so we read it (Apple's own data, built-in `fetch`, no scraper)
 * to recover the phone/iPad shelves when the API gives us none.
 *
 * Everything here is best-effort: any network or shape failure resolves to
 * empty so the caller keeps its icon-only bundle rather than erroring.
 */
export interface PageScreenshots {
  readonly phone: string[];
  readonly ipad: string[];
}

const EMPTY: PageScreenshots = { phone: [], ipad: [] };

// The page's shelf keys for the two device classes we map (App Store has no
// feature graphic; Apple TV / Messages shelves are intentionally ignored).
const PHONE_SHELF = "product_media_phone_";
const IPAD_SHELF = "product_media_pad_";

// One <script type="application/json" id="serialized-server-data"> holds the
// whole listing. Its body is raw JSON (with `<` escaped), so JSON.parse reads it.
const BLOB = /id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/;

/** Fetch the listing page and recover its phone/iPad screenshots. */
export async function fetchAppStoreScreenshots(
  listingUrl: string,
): Promise<PageScreenshots> {
  if (!listingUrl) return EMPTY;
  try {
    // A browser-like UA keeps Apple from serving a stripped page.
    const res = await fetch(listingUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
    });
    if (!res.ok) return EMPTY;
    return parsePageScreenshots(await res.text());
  } catch {
    return EMPTY;
  }
}

/** Pure: extract max-resolution phone/iPad screenshot URLs from page HTML. */
export function parsePageScreenshots(html: string): PageScreenshots {
  const shelves = findShelfMapping(parseBlob(html));
  if (!shelves) return EMPTY;
  return {
    phone: shelfUrls(shelves[PHONE_SHELF]),
    ipad: shelfUrls(shelves[IPAD_SHELF]),
  };
}

function parseBlob(html: string): unknown {
  const match = html.match(BLOB);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

type Shelves = Record<string, unknown>;

/**
 * Locate the object that holds the media shelves. Apple nests it deep and
 * has changed the path before, so we search by key rather than hard-coding
 * the route — the first node owning either device shelf wins.
 */
function findShelfMapping(root: unknown): Shelves | null {
  if (!isObject(root)) return null;
  if (PHONE_SHELF in root || IPAD_SHELF in root) return root as Shelves;
  for (const value of Object.values(root)) {
    const found = findShelfMapping(value);
    if (found) return found;
  }
  return null;
}

function shelfUrls(shelf: unknown): string[] {
  if (!isObject(shelf) || !Array.isArray(shelf.items)) return [];
  return shelf.items
    .map((item) => screenshotUrl(isObject(item) ? item.screenshot : null))
    .filter((url): url is string => url !== null);
}

interface RawShot {
  template: string;
  width: number;
  height: number;
  crop?: string;
  variants?: { format?: string }[];
}

/**
 * Materialise a concrete max-resolution URL from a shelf entry. Apple gives a
 * template ".../{w}x{h}{c}.{f}"; filling it with the native dimensions yields
 * the "<w>x<h><crop>.<ext>" token `appstore-image-url.ts` then caps to source.
 * Hosts are re-checked against the CDN allow-list as defence in depth.
 */
function screenshotUrl(raw: unknown): string | null {
  if (!isShot(raw)) return null;
  const format = raw.variants?.[0]?.format ?? "jpg";
  const url = raw.template
    .replace("{w}", String(raw.width))
    .replace("{h}", String(raw.height))
    .replace("{c}", raw.crop ?? "bb")
    .replace("{f}", format);
  return isAppStoreImageHost(url) ? url : null;
}

function isShot(raw: unknown): raw is RawShot {
  return (
    isObject(raw) &&
    typeof raw.template === "string" &&
    typeof raw.width === "number" &&
    typeof raw.height === "number"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
