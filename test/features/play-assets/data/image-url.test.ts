import { describe, expect, it } from "vitest";
import {
  extFromUrl,
  scaledDownloadUrl,
  withLongestSide,
} from "@/features/play-assets/data/image-url";

const PLAY = "https://play-lh.googleusercontent.com";
const APPLE = "https://is1-ssl.mzstatic.com/image/thumb/x/s.png";

describe("extFromUrl", () => {
  it("detects common image extensions case-insensitively", () => {
    expect(extFromUrl("https://h/a.png")).toBe(".png");
    expect(extFromUrl("https://h/a.JPG")).toBe(".jpg");
    expect(extFromUrl("https://h/a.webp")).toBe(".webp");
  });

  it("ignores query strings", () => {
    expect(extFromUrl("https://h/a.jpg?foo=bar")).toBe(".jpg");
  });

  it("falls back to .png for suffixed Play CDN URLs", () => {
    expect(extFromUrl(`${PLAY}/abc=s0`)).toBe(".png");
  });

  it("reads the extension from an Apple size token", () => {
    expect(extFromUrl(`${APPLE}/512x512bb.jpg`)).toBe(".jpg");
  });
});

describe("withLongestSide (host dispatch)", () => {
  it("uses the Play =s<px> scheme for Play URLs", () => {
    expect(withLongestSide(`${PLAY}/abc=s0`, 256)).toBe(`${PLAY}/abc=s256`);
  });

  it("uses the Apple size-token scheme for mzstatic URLs", () => {
    expect(withLongestSide(`${APPLE}/392x696bb.png`, 348)).toBe(
      `${APPLE}/196x348bb.png`,
    );
  });
});

describe("scaledDownloadUrl", () => {
  it("downloads the original at factor 1", () => {
    expect(scaledDownloadUrl(`${PLAY}/abc=s0`, { w: 1000, h: 2000 }, 1)).toBe(
      `${PLAY}/abc=s0`,
    );
  });

  it("downloads the original when the size is not yet measured", () => {
    expect(scaledDownloadUrl(`${PLAY}/abc=s0`, undefined, 0.5)).toBe(
      `${PLAY}/abc=s0`,
    );
  });

  it("scales the longest side by the factor off the measured original", () => {
    // longest side 2000 × 0.5 → 1000
    expect(scaledDownloadUrl(`${PLAY}/abc=s0`, { w: 1000, h: 2000 }, 0.5)).toBe(
      `${PLAY}/abc=s1000`,
    );
  });

  it("dispatches to the Apple scheme by host", () => {
    // longest side 696 × 0.5 → 348, aspect kept
    expect(
      scaledDownloadUrl(`${APPLE}/392x696bb.png`, { w: 392, h: 696 }, 0.5),
    ).toBe(`${APPLE}/196x348bb.png`);
  });
});
