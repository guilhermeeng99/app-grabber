import { describe, expect, it } from "vitest";
import { formatSize } from "@/core/utils/format-size";

describe("formatSize", () => {
  it("formats bytes", () => {
    expect(formatSize(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes with two decimals", () => {
    expect(formatSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
