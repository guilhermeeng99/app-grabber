import { describe, expect, it } from "vitest";
import {
  maxRes,
  withLongestSide,
} from "@/features/play-assets/data/appstore-image-url";

const BASE =
  "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/ab/cd/ef/s.png";

describe("maxRes (App Store)", () => {
  it("scales a square token up to the max box", () => {
    expect(maxRes(`${BASE}/512x512bb.jpg`)).toBe(`${BASE}/9999x9999bb.jpg`);
  });

  it("keeps aspect ratio for a portrait token (longest side hits the box)", () => {
    // 392x696 → longest 696 maps to 9999, width scales proportionally
    expect(maxRes(`${BASE}/392x696bb.png`)).toBe(`${BASE}/5632x9999bb.png`);
  });

  it("preserves the crop code and quality suffix", () => {
    expect(maxRes(`${BASE}/300x300sr-90.png`)).toBe(
      `${BASE}/9999x9999sr-90.png`,
    );
  });

  it("leaves a 0x0 (already-source) token untouched", () => {
    expect(maxRes(`${BASE}/0x0ss.png`)).toBe(`${BASE}/0x0ss.png`);
  });

  it("returns non-matching URLs unchanged", () => {
    expect(maxRes("https://example.com/not-an-apple-asset")).toBe(
      "https://example.com/not-an-apple-asset",
    );
  });
});

describe("withLongestSide (App Store)", () => {
  it("sets the longest side to px, scaling the other to keep aspect", () => {
    // 392x696 → longest 696 set to 348 → width 196
    expect(withLongestSide(`${BASE}/392x696bb.png`, 348)).toBe(
      `${BASE}/196x348bb.png`,
    );
  });

  it("requests the source (max box) when px is zero or negative", () => {
    expect(withLongestSide(`${BASE}/392x696bb.png`, 0)).toBe(
      `${BASE}/5632x9999bb.png`,
    );
    expect(withLongestSide(`${BASE}/512x512bb.jpg`, -5)).toBe(
      `${BASE}/9999x9999bb.jpg`,
    );
  });
});
