import { describe, expect, it } from "vitest";
import { parseStoreAppId } from "@/features/play-assets/domain/parse-store-app-id";

describe("parseStoreAppId", () => {
  it("extracts the package and store from a Google Play details link", () => {
    expect(
      parseStoreAppId(
        "https://play.google.com/store/apps/details?id=com.whatsapp",
      ),
    ).toEqual({ id: "com.whatsapp", store: "play" });
  });

  it("ignores extra query params on a Play link", () => {
    expect(
      parseStoreAppId(
        "https://play.google.com/store/apps/details?id=com.whatsapp&hl=pt&gl=BR",
      ),
    ).toEqual({ id: "com.whatsapp", store: "play" });
  });

  it("extracts the numeric id and store from an App Store link", () => {
    expect(
      parseStoreAppId(
        "https://apps.apple.com/us/app/whatsapp-messenger/id310633997",
      ),
    ).toEqual({ id: "310633997", store: "appstore" });
  });

  it("extracts the id from an App Store link with a trailing query", () => {
    expect(
      parseStoreAppId(
        "https://apps.apple.com/br/app/whatsapp-messenger/id310633997?mt=8",
      ),
    ).toEqual({ id: "310633997", store: "appstore" });
  });

  it("recognises the legacy itunes.apple.com host", () => {
    expect(
      parseStoreAppId("https://itunes.apple.com/us/app/id310633997"),
    ).toEqual({ id: "310633997", store: "appstore" });
  });

  it("passes a bare Play package through unchanged, with no store", () => {
    expect(parseStoreAppId("com.whatsapp")).toEqual({ id: "com.whatsapp" });
  });

  it("passes a bare numeric App Store id through unchanged", () => {
    expect(parseStoreAppId("310633997")).toEqual({ id: "310633997" });
  });

  it("passes a bare App Store bundle id through unchanged", () => {
    expect(parseStoreAppId("net.whatsapp.WhatsApp")).toEqual({
      id: "net.whatsapp.WhatsApp",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseStoreAppId("  com.whatsapp  ")).toEqual({ id: "com.whatsapp" });
  });

  it("trims a pasted link before parsing", () => {
    expect(
      parseStoreAppId(
        "  https://play.google.com/store/apps/details?id=com.whatsapp  ",
      ),
    ).toEqual({ id: "com.whatsapp", store: "play" });
  });

  it("passes an unrecognised host through as a raw id", () => {
    expect(parseStoreAppId("https://example.com/app/com.whatsapp")).toEqual({
      id: "https://example.com/app/com.whatsapp",
    });
  });

  it("passes a Play link with no id param through unchanged", () => {
    const link = "https://play.google.com/store/apps/details?hl=en";
    expect(parseStoreAppId(link)).toEqual({ id: link });
  });

  it("passes an App Store link with no /id segment through unchanged", () => {
    const link = "https://apps.apple.com/us/app/whatsapp-messenger";
    expect(parseStoreAppId(link)).toEqual({ id: link });
  });
});
