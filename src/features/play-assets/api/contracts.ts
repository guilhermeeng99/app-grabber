import type { AppAssetBundle } from "@/features/play-assets/domain/entities";

/**
 * Wire DTOs shared by the API route handlers and the browser client, so
 * both ends of the network boundary are type-checked against one source.
 */

/** Body of `POST /api/assets`. */
export interface AssetsRequestBody {
  /** App name to search for; ignored when `appId` is present. */
  term?: string;
  /** Exact package id; skips the search step. */
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

/** Success body of `POST /api/assets` is the bundle itself. */
export type AssetsResponse = AppAssetBundle | ApiErrorBody;
