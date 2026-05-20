import { describe, expect, it, vi } from "vitest";
import { retry } from "@/core/utils/retry";

const neverSleep = vi.fn(async () => {});

describe("retry", () => {
  it("returns the first result when it is already satisfactory", async () => {
    const operation = vi.fn(async () => 42);

    const result = await retry(operation, {
      attempts: 3,
      delayMs: 10,
      shouldRetry: (n) => n === 0,
      sleep: neverSleep,
    });

    expect(result).toBe(42);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries until the predicate is satisfied, returning the good value", async () => {
    const results = [0, 0, 7];
    const operation = vi.fn(async () => results.shift()!);

    const result = await retry(operation, {
      attempts: 5,
      delayMs: 10,
      shouldRetry: (n) => n === 0,
      sleep: neverSleep,
    });

    expect(result).toBe(7);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("stops after the attempt budget and returns the last (still-bad) value", async () => {
    const operation = vi.fn(async () => 0);

    const result = await retry(operation, {
      attempts: 2,
      delayMs: 10,
      shouldRetry: (n) => n === 0,
      sleep: neverSleep,
    });

    expect(result).toBe(0);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("waits between attempts using the injected sleep", async () => {
    const delays: number[] = [];
    const sleep = vi.fn(async (ms: number) => {
      delays.push(ms);
    });
    const values = [0, 1];
    const operation = vi.fn(async () => values.shift()!);

    await retry(operation, {
      attempts: 3,
      delayMs: 800,
      shouldRetry: (n) => n === 0,
      sleep,
    });

    expect(delays).toEqual([800]);
  });
});
