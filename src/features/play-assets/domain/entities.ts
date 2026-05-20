/** The three asset families a public Google Play listing exposes. */
export type AssetKind = "icon" | "featureGraphic" | "screenshot";

/**
 * A single downloadable image, already normalised to its maximum
 * resolution (see `play-image-url.ts > maxRes`).
 */
export interface AppAsset {
  readonly kind: AssetKind;
  /** Stable slug, e.g. "icon", "feature-graphic", "screenshot-01". */
  readonly name: string;
  /** Suggested download file name, e.g. "screenshot-01.png". */
  readonly fileName: string;
  /** Max-resolution image URL on play-lh.googleusercontent.com. */
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
  /** Exact package id; skips the search step when present. */
  readonly appId?: string;
}
