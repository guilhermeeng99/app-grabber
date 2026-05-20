"use client";

import { ResultPanel } from "@/features/play-assets/ui/result-panel";
import { SearchForm } from "@/features/play-assets/ui/search-form";
import { usePlayGrabber } from "@/features/play-assets/ui/use-play-grabber";

/** Top-level client island: wires the search form to the per-store results. */
export function PlayGrabber() {
  const { state, grab } = usePlayGrabber();

  return (
    <div className="mt-10 flex flex-col gap-6">
      <SearchForm onSubmit={grab} loading={state.status === "loading"} />

      {state.status === "loading" && (
        <div
          role="status"
          className="flex items-center justify-center gap-3 py-6 text-slate-blue"
        >
          <span className="size-5 animate-spin rounded-full border-2 border-pale-gray border-t-action-blue" />
          Fetching the listings...
        </div>
      )}

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
        >
          {state.errorMessage ?? "Something went wrong."}
        </p>
      )}

      {state.status === "loaded" &&
        state.results?.map((result) => (
          <ResultPanel key={result.store} result={result} />
        ))}
    </div>
  );
}
