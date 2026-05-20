import { describe, expect, it } from "vitest";
import {
  extFromUrl,
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
