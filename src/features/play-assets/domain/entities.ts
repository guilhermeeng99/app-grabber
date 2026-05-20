/** Which app store a request targets. Selects the data source in `di.ts`. */
export type StoreId = "play" | "appstore";

/**
 * The asset families a public listing exposes. `featureGraphic` is Google
 * Play only — the App Store has no equivalent, so Apple bundles never carry
 * one (see the per-store mappers).
 */
export type AssetKind = "icon" | "featureGraphic" | "screenshot";

/**
 * A single downloadable image, already normalised to its maximum
 * resolution by the store's image resolver (`play-image-url.ts` /
 * `appstore-image-url.ts`).
 */
export interface AppAsset {
  readonly kind: AssetKind;
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

/** Input for the top-level "resolve everything" use case. */
export interface GrabRequest extends StoreLocale {
  /** App name to search for; ignored when `appId` is provided. */
  readonly term?: string;
  /** Exact package id (Play) / bundle or numeric id (App Store); skips search. */
  readonly appId?: string;
}
