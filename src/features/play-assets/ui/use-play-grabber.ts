"use client";

import { useCallback, useReducer } from "react";
import type {
  ApiErrorBody,
  AssetsRequestBody,
  AssetsResponse,
} from "@/features/play-assets/api/contracts";
import type { AppAssetBundle } from "@/features/play-assets/domain/entities";
import {
  initialGrabState,
  playGrabberReducer,
} from "@/features/play-assets/ui/play-grabber-reducer";

function isApiError(body: AssetsResponse): body is ApiErrorBody {
  return "error" in body;
}

/** React binding around the play-grabber reducer + the `/api/assets` call. */
export function usePlayGrabber() {
  const [state, dispatch] = useReducer(playGrabberReducer, initialGrabState);

  const grab = useCallback(async (request: AssetsRequestBody) => {
    dispatch({ type: "submit", request });
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as AssetsResponse;

      if (!response.ok || isApiError(body)) {
        const message = isApiError(body)
          ? body.error.message
          : "Something went wrong.";
        dispatch({ type: "error", message });
        return;
      }

      dispatch({ type: "loaded", bundle: body as AppAssetBundle });
    } catch {
      dispatch({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { state, grab, reset };
}
