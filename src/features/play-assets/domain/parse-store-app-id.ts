import type { StoreId } from "@/features/play-assets/domain/entities";

/** A store id pulled out of raw user input (a bare id or a pasted link). */
export interface ParsedStoreAppId {
  /** The extracted id (Play package / App Store numeric or bundle id), or the
   *  trimmed input unchanged when it is not a recognised store URL. */
  readonly id: string;
  /** The store the link names — only set when the input was a recognised URL. */
  readonly store?: StoreId;
}

const PLAY_HOSTS = new Set(["play.google.com"]);
const APPSTORE_HOSTS = new Set(["apps.apple.com", "itunes.apple.com"]);

/**
 * Let a user paste a full store link instead of typing an exact id: pull the
 * id (and the store it belongs to) out of a Google Play / App Store URL. A
 * recognised link's store is authoritative — the caller should prefer it over
 * any separately-chosen store. Non-URL input, an unrecognised host, or a link
 * with no extractable id is returned trimmed and unchanged, so a raw id keeps
 * working.
 */
export function parseStoreAppId(raw: string): ParsedStoreAppId {
  const trimmed = raw.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { id: trimmed };
  }

  const host = url.hostname.toLowerCase();
  if (PLAY_HOSTS.has(host)) {
    const id = url.searchParams.get("id")?.trim();
    return id ? { id, store: "play" } : { id: trimmed };
  }
  if (APPSTORE_HOSTS.has(host)) {
    const id = matchAppStoreTrackId(url.pathname);
    return id ? { id, store: "appstore" } : { id: trimmed };
  }
  return { id: trimmed };
}

// App Store listing paths end in `/id<digits>`, e.g. /us/app/whatsapp/id310633997.
function matchAppStoreTrackId(pathname: string): string | null {
  return pathname.match(/\/id(\d+)/)?.[1] ?? null;
}
