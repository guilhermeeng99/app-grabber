import type { AssetsRequestBody } from "@/features/play-assets/api/contracts";
import type { AppAssetBundle } from "@/features/play-assets/domain/entities";

export type GrabStatus = "idle" | "loading" | "loaded" | "error";

export interface GrabState {
  readonly status: GrabStatus;
  readonly bundle: AppAssetBundle | null;
  readonly errorMessage: string | null;
  /** Request that produced the current bundle — reused to build the ZIP link. */
  readonly request: AssetsRequestBody | null;
}

export type GrabAction =
  | { type: "submit"; request: AssetsRequestBody }
  | { type: "loaded"; bundle: AppAssetBundle }
  | { type: "error"; message: string }
  | { type: "reset" };

export const initialGrabState: GrabState = {
  status: "idle",
  bundle: null,
  errorMessage: null,
  request: null,
};

/**
 * Pure UI state machine — the analogue of a financo Cubit's emitted
 * states. Kept free of React so it can be unit-tested directly
 * (see `use-play-grabber.test.ts`).
 *
 *   idle ──submit──▶ loading ──loaded──▶ loaded
 *                            └──error──▶ error
 *   (any) ──submit──▶ loading      (any) ──reset──▶ idle
 */
export function playGrabberReducer(
  state: GrabState,
  action: GrabAction,
): GrabState {
  switch (action.type) {
    case "submit":
      return {
        status: "loading",
        bundle: null,
        errorMessage: null,
        request: action.request,
      };
    case "loaded":
      return {
        ...state,
        status: "loaded",
        bundle: action.bundle,
        errorMessage: null,
      };
    case "error":
      return {
        ...state,
        status: "error",
        bundle: null,
        errorMessage: action.message,
      };
    case "reset":
      return initialGrabState;
  }
}
