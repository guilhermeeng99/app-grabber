import { describe, expect, it } from "vitest";
import {
  isAllowedImageHost,
  isAppStoreImageHost,
} from "@/features/play-assets/data/image-host";

const PLAY = "https://play-lh.googleusercontent.com/x=s0";
const APPLE = "https://is1-ssl.mzstatic.com/image/thumb/x/512x512bb.jpg";

describe("isAllowedImageHost", () => {
  it("accepts the Play CDN over https", () => {
    expect(isAllowedImageHost(PLAY)).toBe(true);
  });

  it("accepts an Apple mzstatic subdomain over https", () => {
    expect(isAllowedImageHost(APPLE)).toBe(true);
    expect(isAllowedImageHost("https://is5-ssl.mzstatic.com/a/1x1bb.png")).toBe(
      true,
    );
  });

  it("rejects a look-alike host that only ends with mzstatic.com as a label", () => {
    expect(isAllowedImageHost("https://mzstatic.com.evil.com/x")).toBe(false);
  });

  it("rejects any other host", () => {
    expect(isAllowedImageHost("https://evil.example.com/x")).toBe(false);
  });

  it("rejects plain http for both CDNs", () => {
    expect(isAllowedImageHost("http://play-lh.googleusercontent.com/x")).toBe(
      false,
    );
    expect(isAllowedImageHost("http://is1-ssl.mzstatic.com/x")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isAllowedImageHost("not a url")).toBe(false);
  });
});

describe("isAppStoreImageHost", () => {
  it("is true only for mzstatic subdomains", () => {
    expect(isAppStoreImageHost(APPLE)).toBe(true);
    expect(isAppStoreImageHost(PLAY)).toBe(false);
    expect(isAppStoreImageHost("https://mzstatic.com.evil.com/x")).toBe(false);
    expect(isAppStoreImageHost("garbage")).toBe(false);
  });
});
