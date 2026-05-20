import { afterEach, describe, expect, it, vi } from "vitest";
import { ItunesDataSource } from "@/features/play-assets/data/app-store-datasource";
import {
  makeItunesResult,
  type RawItunesResult,
} from "../../../harness/factories/app-store-listing-factory";
import { makeAppStorePageHtml } from "../../../harness/factories/app-store-page-factory";

const locale = { country: "us", lang: "en" };

/** Route the global fetch: iTunes JSON for the lookup, HTML for the page. */
function stubFetch(opts: { results: RawItunesResult[]; page?: Response }) {
  const fetchMock = vi.fn((input: string | URL) => {
    const url = String(input);
    if (url.includes("itunes.apple.com")) {
      return Promise.resolve(
        new Response(JSON.stringify({ results: opts.results }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }
    return Promise.resolve(
      opts.page ?? new Response(makeAppStorePageHtml(), { status: 200 }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("ItunesDataSource.app screenshot fallback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the API screenshots and never fetches the page", async () => {
    const fetchMock = stubFetch({
      results: [makeItunesResult({ bundleId: "net.x" })],
    });

    const app = await new ItunesDataSource().app("net.x", locale);

    expect(app.screenshots).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // lookup only
  });

  it("fills screenshots from the listing page when the API returns none", async () => {
    const fetchMock = stubFetch({
      results: [
        makeItunesResult({ screenshotUrls: [], ipadScreenshotUrls: [] }),
      ],
    });

    const app = await new ItunesDataSource().app("net.x", locale);

    expect(app.screenshots).toHaveLength(2);
    expect(app.ipadScreenshots).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2); // lookup + page
  });

  it("leaves the app icon-only when the page fallback also finds nothing", async () => {
    stubFetch({
      results: [
        makeItunesResult({ screenshotUrls: [], ipadScreenshotUrls: [] }),
      ],
      page: new Response("no blob here", { status: 200 }),
    });

    const app = await new ItunesDataSource().app("net.x", locale);

    expect(app.screenshots ?? []).toHaveLength(0);
    expect(app.ipadScreenshots ?? []).toHaveLength(0);
  });

  it("throws a 404-style error when the lookup is empty", async () => {
    stubFetch({ results: [] });

    await expect(new ItunesDataSource().app("net.x", locale)).rejects.toThrow(
      /404/,
    );
  });
});
