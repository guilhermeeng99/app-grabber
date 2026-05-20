import { NetworkError, NotFoundError, ServerError } from "@/core/errors";
import { err, ok } from "@/core/result";
import type { Result } from "@/core/result";
import type { AppSummary } from "@/features/play-assets/domain/entities";

/** The fields every store's raw search hit shares, mapped to `AppSummary`. */
type RawSummary = {
  appId: string;
  title: string;
  developer: string;
  icon: string;
};

/**
 * Map a store's raw search results to the top `AppSummary`, or `NotFound`
 * when empty. Shared by both repositories (rule: search keeps the first
 * match only).
 */
export function topSummary(
  results: readonly RawSummary[],
  term: string,
): Result<AppSummary> {
  const top = results[0];
  if (!top) {
    return err(new NotFoundError(`No app found for "${term}".`));
  }
  return ok({
    appId: top.appId,
    title: top.title,
    developer: top.developer,
    icon: top.icon,
  });
}

/**
 * Map a thrown scraper/network error onto the domain hierarchy. Scrapers
 * throw a plain `Error` carrying the HTTP status in the message (e.g.
 * "App not found (404)"), so the status is matched textually: 404 →
 * NotFound, transport failures → Network, anything else → Server.
 * `storeName` personalises the user-facing message ("Google Play" / "the
 * App Store").
 */
export function toAppError(
  error: unknown,
  storeName: string,
): NotFoundError | NetworkError | ServerError {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b404\b|not found/i.test(message)) {
    return new NotFoundError(`App not found on ${storeName}.`);
  }
  if (
    /network|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch/i.test(message)
  ) {
    return new NetworkError(`Could not reach ${storeName}.`);
  }
  return new ServerError(message);
}
