import { describe, expect, it } from "vitest";
import {
  maxRes,
  withLongestSide,
} from "@/features/play-assets/data/play-image-url";

const CDN = "https://play-lh.googleusercontent.com";

describe("maxRes (Google Play)", () => {
  it("replaces an existing size suffix with =s0", () => {
    expect(maxRes(`${CDN}/abc=w526-h296`)).toBe(`${CDN}/abc=s0`);
  });

  it("appends =s0 when there is no suffix", () => {
    expect(maxRes(`${CDN}/abc`)).toBe(`${CDN}/abc=s0`);
  });

  it("does not mistake the protocol slashes for a suffix", () => {
    expect(maxRes("https://host/path")).toBe("https://host/path=s0");
  });
});

describe("withLongestSide (Google Play)", () => {
  it("returns the original (=s0) when px is zero or negative", () => {
    expect(withLongestSide(`${CDN}/abc=s0`, 0)).toBe(`${CDN}/abc=s0`);
    expect(withLongestSide(`${CDN}/abc=w100`, -5)).toBe(`${CDN}/abc=s0`);
  });

  it("sets the longest side, rounding to the nearest pixel", () => {
    expect(withLongestSide(`${CDN}/abc=s0`, 621)).toBe(`${CDN}/abc=s621`);
    expect(withLongestSide(`${CDN}/abc=s0`, 620.6)).toBe(`${CDN}/abc=s621`);
  });

  it("replaces an existing size suffix", () => {
    expect(withLongestSide(`${CDN}/abc=w526-h296`, 256)).toBe(
      `${CDN}/abc=s256`,
    );
  });
});
