import type {
  AssetsRequestBody,
  StoreGrabResultDTO,
} from "@/features/play-assets/api/contracts";

export type GrabStatus = "idle" | "loading" | "loaded" | "error";

export interface GrabState {
  readonly status: GrabStatus;
  /** One outcome per resolved store (bundle or per-store error). */
  readonly results: StoreGrabResultDTO[] | null;
  /** Request-level failure only (bad input / network to our own API). */
  readonly errorMessage: string | null;
  /** Request that produced the current results — reused to rebuild ZIP links. */
  readonly request: AssetsRequestBody | null;
}

export type GrabAction =
  | { type: "submit"; request: AssetsRequestBody }
  | { type: "loaded"; results: StoreGrabResultDTO[] }
  | { type: "error"; message: string }
  | { type: "reset" };

export const initialGrabState: GrabState = {
  status: "idle",
  results: null,
  errorMessage: null,
  request: null,
};

/**
 * Pure UI state machine — the analogue of a financo Cubit's emitted
 * states. Kept free of React so it can be unit-tested directly
 * (see `play-grabber-reducer.test.ts`). `loaded` carries the per-store
 * results (each may itself be a success or a failure); `error` is reserved
 * for request-level failures, not a single store's miss.
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
        results: null,
        errorMessage: null,
        request: action.request,
      };
    case "loaded":
      return {
        ...state,
        status: "loaded",
        results: action.results,
        errorMessage: null,
      };
    case "error":
      return {
        ...state,
        status: "error",
        results: null,
        errorMessage: action.message,
      };
    case "reset":
      return initialGrabState;
  }
}
