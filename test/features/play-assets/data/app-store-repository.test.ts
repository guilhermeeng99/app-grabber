import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStoreAssetsRepositoryImpl } from "@/features/play-assets/data/app-store-repository";
import type { AppStoreDataSource } from "@/features/play-assets/data/app-store-datasource";
import { createAppStoreDataSourceMock } from "../../../harness/mocks";
import { makeRawAppStoreApp } from "../../../harness/factories/app-store-listing-factory";
import { expectErr, expectOk } from "../../../harness/helpers";

const locale = { country: "us", lang: "en" };

describe("AppStoreAssetsRepositoryImpl", () => {
  let dataSource: AppStoreDataSource;
  let repository: AppStoreAssetsRepositoryImpl;

  beforeEach(() => {
    dataSource = createAppStoreDataSourceMock();
    repository = new AppStoreAssetsRepositoryImpl(dataSource);
  });

  describe("search", () => {
    it("maps the top result to an AppSummary by bundle id", async () => {
      vi.mocked(dataSource.search).mockResolvedValue([
        makeRawAppStoreApp({ appId: "net.x", title: "X" }),
        makeRawAppStoreApp({ appId: "net.y", title: "Y" }),
      ]);

      const summary = expectOk(
        await repository.search({ term: "x", ...locale }),
      );

      expect(summary.appId).toBe("net.x");
      expect(summary.title).toBe("X");
    });

    it("returns NotFound when there are no results", async () => {
      vi.mocked(dataSource.search).mockResolvedValue([]);
      const error = expectErr(
        await repository.search({ term: "ghost", ...locale }),
      );
      expect(error.kind).toBe("notFound");
    });

    it("maps a 404 throw to NotFound", async () => {
      vi.mocked(dataSource.search).mockRejectedValue(
        new Error("App not found (404)"),
      );
      const error = expectErr(await repository.search({ term: "x", ...locale }));
      expect(error.kind).toBe("notFound");
    });

    it("maps a transport throw to Network", async () => {
      vi.mocked(dataSource.search).mockRejectedValue(
        new Error("getaddrinfo ENOTFOUND itunes.apple.com"),
      );
      const error = expectErr(await repository.search({ term: "x", ...locale }));
      expect(error.kind).toBe("network");
    });
  });

  describe("getAssets", () => {
    it("builds an App Store bundle with the listing URL and store tag", async () => {
      vi.mocked(dataSource.app).mockResolvedValue(
        makeRawAppStoreApp({
          appId: "net.x",
          title: "X",
          url: "https://apps.apple.com/us/app/x/id42",
        }),
      );

      const bundle = expectOk(await repository.getAssets("net.x", locale));

      expect(bundle.appId).toBe("net.x");
      expect(bundle.title).toBe("X");
      expect(bundle.store).toBe("appstore");
      expect(bundle.listingUrl).toBe("https://apps.apple.com/us/app/x/id42");
      expect(bundle.assets.length).toBeGreaterThan(0);
    });

    it("falls back to the numeric-id URL when trackViewUrl is empty", async () => {
      vi.mocked(dataSource.app).mockResolvedValue(
        makeRawAppStoreApp({ id: 99, url: "" }),
      );

      const bundle = expectOk(await repository.getAssets("net.x", locale));

      expect(bundle.listingUrl).toBe("https://apps.apple.com/app/id99");
    });

    it("maps an unknown throw to Server", async () => {
      vi.mocked(dataSource.app).mockRejectedValue(new Error("boom"));
      const error = expectErr(await repository.getAssets("net.x", locale));
      expect(error.kind).toBe("server");
    });
  });
});
