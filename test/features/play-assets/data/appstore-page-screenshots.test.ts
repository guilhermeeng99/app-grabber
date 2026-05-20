import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAppStoreScreenshots,
  parsePageScreenshots,
} from "@/features/play-assets/data/appstore-page-screenshots";
import { makeAppStorePageHtml } from "../../../harness/factories/app-store-page-factory";

describe("parsePageScreenshots", () => {
  it("materialises phone and iPad URLs from the page blob", () => {
    const shots = parsePageScreenshots(makeAppStorePageHtml());

    expect(shots.phone).toHaveLength(2);
    expect(shots.ipad).toHaveLength(1);
    // template placeholders are filled with the native dimensions
    expect(shots.phone[0]).toBe(
      "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/ab/cd/ef/phone.png/1290x2796bb.jpeg",
    );
    expect(shots.ipad[0]).toContain("/2048x2732bb.jpeg");
    expect(shots.phone.every((u) => !u.includes("{"))).toBe(true);
  });

  it("returns empty when the page has no screenshot shelves", () => {
    const shots = parsePageScreenshots(
      makeAppStorePageHtml({ phone: [], ipad: [] }),
    );
    expect(shots).toEqual({ phone: [], ipad: [] });
  });

  it("keeps phone screenshots when the iPad shelf is absent", () => {
    const shots = parsePageScreenshots(makeAppStorePageHtml({ ipad: [] }));
    expect(shots.phone.length).toBeGreaterThan(0);
    expect(shots.ipad).toHaveLength(0);
  });

  it("drops entries whose host is not the Apple CDN (SSRF defence)", () => {
    const shots = parsePageScreenshots(
      makeAppStorePageHtml({
        phone: [{ template: "https://evil.com/x/{w}x{h}{c}.{f}" }],
        ipad: [],
      }),
    );
    expect(shots.phone).toHaveLength(0);
  });

  it("returns empty for a page without the data blob", () => {
    expect(parsePageScreenshots("<html><body>no blob</body></html>")).toEqual({
      phone: [],
      ipad: [],
    });
  });

  it("returns empty when the blob is not valid JSON", () => {
    const html =
      '<script type="application/json" id="serialized-server-data">{ not json </script>';
    expect(parsePageScreenshots(html)).toEqual({ phone: [], ipad: [] });
  });
});

describe("fetchAppStoreScreenshots", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses screenshots from a fetched listing page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(makeAppStorePageHtml(), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const shots = await fetchAppStoreScreenshots("https://apps.apple.com/x");

    expect(shots.phone).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns empty without fetching when the listing URL is blank", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const shots = await fetchAppStoreScreenshots("");

    expect(shots).toEqual({ phone: [], ipad: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    expect(await fetchAppStoreScreenshots("https://apps.apple.com/x")).toEqual({
      phone: [],
      ipad: [],
    });
  });

  it("returns empty when the fetch throws (never breaks the lookup)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    expect(await fetchAppStoreScreenshots("https://apps.apple.com/x")).toEqual({
      phone: [],
      ipad: [],
    });
  });
});
