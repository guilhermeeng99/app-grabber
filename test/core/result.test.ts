import { describe, expect, it } from "vitest";
import { err, ok } from "@/core/result";

describe("Result", () => {
  it("ok wraps a value", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err wraps an error", () => {
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });
});
