import { describe, expect, it } from "vitest";
import {
  extFromUrl,
  isAllowedImageHost,
  maxRes,
  withLongestSide,
} from "@/features/play-assets/data/play-image-url";

const CDN = "https://play-lh.googleusercontent.com";

describe("maxRes", () => {
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

describe("extFromUrl", () => {
  it("detects common image extensions case-insensitively", () => {
    expect(extFromUrl("https://h/a.png")).toBe(".png");
    expect(extFromUrl("https://h/a.JPG")).toBe(".jpg");
    expect(extFromUrl("https://h/a.webp")).toBe(".webp");
  });

  it("ignores query strings", () => {
    expect(extFromUrl("https://h/a.jpg?foo=bar")).toBe(".jpg");
  });

  it("falls back to .png for suffixed CDN URLs", () => {
    expect(extFromUrl(`${CDN}/abc=s0`)).toBe(".png");
  });
});

describe("isAllowedImageHost", () => {
  it("accepts the Play CDN over https", () => {
    expect(isAllowedImageHost(`${CDN}/x=s0`)).toBe(true);
  });

  it("rejects any other host", () => {
    expect(isAllowedImageHost("https://evil.example.com/x")).toBe(false);
  });

  it("rejects plain http", () => {
    expect(isAllowedImageHost("http://play-lh.googleusercontent.com/x")).toBe(
      false,
    );
  });

  it("rejects malformed URLs", () => {
    expect(isAllowedImageHost("not a url")).toBe(false);
  });
});

describe("withLongestSide", () => {
  it("returns the original (=s0) when px is zero or negative", () => {
    expect(withLongestSide(`${CDN}/abc=s0`, 0)).toBe(`${CDN}/abc=s0`);
    expect(withLongestSide(`${CDN}/abc=w100`, -5)).toBe(`${CDN}/abc=s0`);
  });

  it("sets the longest side, rounding to the nearest pixel", () => {
    expect(withLongestSide(`${CDN}/abc=s0`, 621)).toBe(`${CDN}/abc=s621`);
    expect(withLongestSide(`${CDN}/abc=s0`, 620.6)).toBe(`${CDN}/abc=s621`);
  });

  it("replaces an existing size suffix", () => {
    expect(withLongestSide(`${CDN}/abc=w526-h296`, 256)).toBe(`${CDN}/abc=s256`);
  });
});
