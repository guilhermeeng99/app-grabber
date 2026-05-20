import { describe, expect, it } from "vitest";
import { slugify } from "@/core/utils/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("CapyCare Self-Care Pet")).toBe("capycare-self-care-pet");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("  Hello!! ")).toBe("hello");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugify("a___b   c")).toBe("a-b-c");
  });

  it("caps the result at 60 characters", () => {
    expect(slugify("a".repeat(80))).toHaveLength(60);
  });
});
