import { describe, expect, it } from "vitest";
import { err, mapResult, ok } from "@/core/result";

describe("Result", () => {
  it("ok wraps a value", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err wraps an error", () => {
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });

  it("mapResult transforms the success value", () => {
    expect(mapResult(ok(2), (n) => n * 3)).toEqual(ok(6));
  });

  it("mapResult passes failures through untouched", () => {
    const failure = err("nope");
    expect(mapResult(failure, (n: number) => n * 3)).toBe(failure);
  });
});
