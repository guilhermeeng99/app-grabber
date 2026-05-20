/**
 * Minimal in-memory cache with per-entry expiry.
 *
 * Used to memoise non-empty Play search results for a few minutes so repeated
 * identical queries do not re-hit Google (fewer requests → less rate-limiting).
 * The clock is injected so expiry is testable without real time. Single-process
 * only — fine for this app's lifetime-of-the-server datasource singleton.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }
}
