import type {
  AppAssetBundle,
  StoreId,
} from "@/features/play-assets/domain/entities";

/**
 * Wire DTOs shared by the API route handlers and the browser client, so
 * both ends of the network boundary are type-checked against one source.
 */

/** Body of `POST /api/assets`. */
export interface AssetsRequestBody {
  /** Store for an `appId` (id mode only); a name search ignores it and
   * queries both stores. Defaults to "play". */
  store?: StoreId;
  /** App name to search for; ignored when `appId` is present. */
  term?: string;
  /** Exact id (Play package / App Store bundle or numeric); skips search. */
  appId?: string;
  /** Two-letter store country code; defaults to "us". */
  country?: string;
  /** Two-letter listing language code; defaults to "en". */
  lang?: string;
}

/** One file to place in the ZIP. */
export interface ZipItem {
  url: string;
  fileName: string;
}

/**
 * Body of `POST /api/download/zip`. The client sends already-sized image
 * URLs (it knows each asset's measured dimensions, required for the size
 * multiplier); the server re-validates every host before fetching.
 */
export interface ZipRequestBody {
  zipName?: string;
  items: ZipItem[];
}

/** Uniform error envelope returned by every route on failure. */
export interface ApiErrorBody {
  error: { kind: string; message: string };
}

/**
 * One store's outcome in a multi-store grab: `bundle` on success, `error` on
 * a per-store failure (not found / network / throttle). Exactly one is set.
 */
export interface StoreGrabResultDTO {
  store: StoreId;
  bundle?: AppAssetBundle;
  error?: { kind: string; message: string };
}

/** Success body of `POST /api/assets`: one result per resolved store. */
export interface AssetsSuccessBody {
  results: StoreGrabResultDTO[];
}

/** A request-level failure (bad JSON / no input) still uses the envelope. */
export type AssetsResponse = AssetsSuccessBody | ApiErrorBody;
