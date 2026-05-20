import { describe, expect, it } from "vitest";
import {
  normaliseLocale,
  sanitizeFileName,
} from "@/app/api/_lib/request-helpers";

describe("normaliseLocale", () => {
  it("lowercases a valid two-letter code", () => {
    expect(normaliseLocale("US", "en")).toBe("us");
    expect(normaliseLocale("br", "en")).toBe("br");
  });

  it("falls back when the value is missing or malformed", () => {
    expect(normaliseLocale(undefined, "en")).toBe("en");
    expect(normaliseLocale("eng", "en")).toBe("en");
    expect(normaliseLocale("p", "en")).toBe("en");
    expect(normaliseLocale(42, "us")).toBe("us");
  });
});

describe("sanitizeFileName", () => {
  it("strips path separators and header-breaking characters", () => {
    expect(sanitizeFileName('a/b"c\nd.png')).toBe("abcd.png");
  });

  it("falls back for empty or non-string input", () => {
    expect(sanitizeFileName(undefined)).toBe("image");
    expect(sanitizeFileName("   ", "fallback")).toBe("fallback");
  });

  it("caps the length at 120 characters", () => {
    expect(sanitizeFileName("a".repeat(200))).toHaveLength(120);
  });
});
