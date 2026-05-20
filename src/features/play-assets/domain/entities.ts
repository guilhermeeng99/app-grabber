import type { Result } from "@/core/result";

/** Which app store a request targets. Selects the data source in `di.ts`. */
export type StoreId = "play" | "appstore";

/**
 * The asset families a public listing exposes. `featureGraphic` is Google
 * Play only — the App Store has no equivalent, so Apple bundles never carry
 * one (see the per-store mappers).
 */
export type AssetKind = "icon" | "featureGraphic" | "screenshot";

/**
 * The display/download group an asset belongs to. Set by each store's mapper
 * so the UI can group assets and offer per-section ZIPs without parsing names.
 * `banner` (Play feature graphic) and `tablet` (App Store iPad screenshots)
 * are store-specific; Play screenshots are all `phone`.
 */
export type AssetSection = "icon" | "banner" | "phone" | "tablet";

/**
 * A single downloadable image, already normalised to its maximum
 * resolution by the store's image resolver (`play-image-url.ts` /
 * `appstore-image-url.ts`).
 */
export interface AppAsset {
  readonly kind: AssetKind;
  /** UI grouping / per-section download bucket. */
  readonly section: AssetSection;
  /** Stable slug, e.g. "icon", "feature-graphic", "screenshot-01". */
  readonly name: string;
  /** Suggested download file name, e.g. "screenshot-01.png". */
  readonly fileName: string;
  /** Max-resolution image URL on the store's image CDN. */
  readonly url: string;
}

/** A single hit from a store search — enough to identify the app. */
export interface AppSummary {
  readonly appId: string;
  readonly title: string;
  readonly developer: string;
  readonly icon: string;
}

/** A resolved app plus every downloadable asset, ready for UI/ZIP. */
export interface AppAssetBundle {
  readonly appId: string;
  readonly title: string;
  readonly developer: string;
  /** Which store this bundle came from — drives the UI's store link/label. */
  readonly store: StoreId;
  /** Public listing URL (Play details page / apps.apple.com page). */
  readonly listingUrl: string;
  readonly assets: readonly AppAsset[];
}

/** Store-front locale shared by search and detail lookups. */
export interface StoreLocale {
  readonly country: string;
  readonly lang: string;
}

export interface SearchQuery extends StoreLocale {
  readonly term: string;
}

/** Input for the single-store "resolve everything" use case. */
export interface GrabRequest extends StoreLocale {
  /** App name to search for; ignored when `appId` is provided. */
  readonly term?: string;
  /** Exact package id (Play) / bundle or numeric id (App Store); skips search. */
  readonly appId?: string;
}

/** Input for the multi-store grab: a name fans out to both stores, an id targets one. */
export interface MultiGrabRequest extends StoreLocale {
  /** App name; when present, every store is resolved. */
  readonly term?: string;
  /** Exact id; when present, only `store` is resolved (id is store-bound). */
  readonly appId?: string;
  /** Which store an `appId` belongs to (id mode only); defaults to "play". */
  readonly store?: StoreId;
}

/** One store's outcome within a multi-store grab — success or per-store failure. */
export interface StoreGrabOutcome {
  readonly store: StoreId;
  readonly result: Result<AppAssetBundle>;
}

/** The collected per-store outcomes of a multi-store grab. */
export interface MultiGrabResult {
  readonly outcomes: readonly StoreGrabOutcome[];
}
