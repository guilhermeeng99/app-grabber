/**
 * Retry an async operation while a predicate says its result is unsatisfactory.
 *
 * Built for flaky scrapers: Google Play's search-page parser intermittently
 * returns an empty list under rate-limiting, so one extra attempt with a short
 * backoff turns most transient misses into hits. It does not mask a genuine
 * "not found" — the caller's `shouldRetry` decides what counts as a miss, and a
 * truly empty listing simply costs one extra (cheap) request.
 */
export interface RetryOptions<T> {
  /** Total attempts including the first (must be >= 1). */
  readonly attempts: number;
  /** Delay between attempts, in milliseconds. */
  readonly delayMs: number;
  /** Retry while this returns true and attempts remain. */
  readonly shouldRetry: (value: T) => boolean;
  /** Injected for tests; defaults to a real timer. */
  readonly sleep?: (ms: number) => Promise<void>;
}

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions<T>,
): Promise<T> {
  const sleep = options.sleep ?? realSleep;
  let result = await operation();
  for (let attempt = 1; attempt < options.attempts; attempt++) {
    if (!options.shouldRetry(result)) return result;
    await sleep(options.delayMs);
    result = await operation();
  }
  return result;
}
