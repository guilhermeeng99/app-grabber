import { describe, expect, it } from "vitest";
import { TtlCache } from "@/core/utils/ttl-cache";

/** A controllable clock so expiry is tested without real time. */
function fakeClock(start = 0) {
  let now = start;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("TtlCache", () => {
  it("returns undefined for an unknown key", () => {
    const cache = new TtlCache<number>(1000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns a stored value before it expires", () => {
    const clock = fakeClock();
    const cache = new TtlCache<string>(1000, clock.now);

    cache.set("k", "v");
    clock.advance(999);

    expect(cache.get("k")).toBe("v");
  });

  it("evicts a value once the ttl has elapsed", () => {
    const clock = fakeClock();
    const cache = new TtlCache<string>(1000, clock.now);

    cache.set("k", "v");
    clock.advance(1000);

    expect(cache.get("k")).toBeUndefined();
  });

  it("overwrites an existing key and refreshes its expiry", () => {
    const clock = fakeClock();
    const cache = new TtlCache<string>(1000, clock.now);

    cache.set("k", "first");
    clock.advance(900);
    cache.set("k", "second");
    clock.advance(900);

    expect(cache.get("k")).toBe("second");
  });
});
