import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayAssetsRepositoryImpl } from "@/features/play-assets/data/play-assets-repository";
import type { PlayStoreDataSource } from "@/features/play-assets/data/play-store-datasource";
import { createDataSourceMock } from "../../../harness/mocks";
import {
  makeRawApp,
  makeRawSearchItem,
} from "../../../harness/factories/app-listing-factory";
import { expectErr, expectOk } from "../../../harness/helpers";

const locale = { country: "us", lang: "en" };

describe("PlayAssetsRepositoryImpl", () => {
  let dataSource: PlayStoreDataSource;
  let repository: PlayAssetsRepositoryImpl;

  beforeEach(() => {
    dataSource = createDataSourceMock();
    repository = new PlayAssetsRepositoryImpl(dataSource);
  });

  describe("search", () => {
    it("maps the top result to an AppSummary", async () => {
      vi.mocked(dataSource.search).mockResolvedValue([
        makeRawSearchItem({ appId: "com.x", title: "X" }),
        makeRawSearchItem({ appId: "com.y", title: "Y" }),
      ]);

      const summary = expectOk(await repository.search({ term: "x", ...locale }));

      expect(summary.appId).toBe("com.x");
      expect(summary.title).toBe("X");
    });

    it("returns NotFound when there are no results", async () => {
      vi.mocked(dataSource.search).mockResolvedValue([]);
      const error = expectErr(await repository.search({ term: "ghost", ...locale }));
      expect(error.kind).toBe("notFound");
    });

    it("maps a 404 throw to NotFound", async () => {
      vi.mocked(dataSource.search).mockRejectedValue(
        new Error("Request failed with status code 404"),
      );
      const error = expectErr(await repository.search({ term: "x", ...locale }));
      expect(error.kind).toBe("notFound");
    });

    it("maps a transport throw to Network", async () => {
      vi.mocked(dataSource.search).mockRejectedValue(
        new Error("getaddrinfo ENOTFOUND play.google.com"),
      );
      const error = expectErr(await repository.search({ term: "x", ...locale }));
      expect(error.kind).toBe("network");
    });
  });

  describe("getAssets", () => {
    it("builds a bundle from the listing", async () => {
      vi.mocked(dataSource.app).mockResolvedValue(
        makeRawApp({ appId: "com.x", title: "X" }),
      );

      const bundle = expectOk(await repository.getAssets("com.x", locale));

      expect(bundle.appId).toBe("com.x");
      expect(bundle.title).toBe("X");
      expect(bundle.store).toBe("play");
      expect(bundle.listingUrl).toBe(
        "https://play.google.com/store/apps/details?id=com.x",
      );
      expect(bundle.assets.length).toBeGreaterThan(0);
    });

    it("maps an unknown throw to Server", async () => {
      vi.mocked(dataSource.app).mockRejectedValue(new Error("boom"));
      const error = expectErr(await repository.getAssets("com.x", locale));
      expect(error.kind).toBe("server");
    });
  });
});
