import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { NotFoundError, ValidationError } from "@/core/errors";
import { err, ok } from "@/core/result";
import { POST } from "@/app/api/assets/route";
import type { StoreGrabResultDTO } from "@/features/play-assets/api/contracts";
import { getGrabFromStoresUseCase } from "@/features/play-assets/di";
import { makeAppAssetBundle } from "../../../harness/factories/app-asset-factory";

// The route's job beyond validation is to call the multi-store use case and
// flatten its outcomes, so the composition root is mocked and asserted.
vi.mock("@/features/play-assets/di", () => ({
  getGrabFromStoresUseCase: vi.fn(),
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/assets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function resultsOf(res: Response): Promise<StoreGrabResultDTO[]> {
  const body = (await res.json()) as { results: StoreGrabResultDTO[] };
  return body.results;
}

describe("POST /api/assets", () => {
  const call = vi.fn();

  beforeEach(() => {
    vi.mocked(getGrabFromStoresUseCase).mockReturnValue({
      call,
    } as unknown as ReturnType<typeof getGrabFromStoresUseCase>);
    call.mockResolvedValue(
      ok({ outcomes: [{ store: "play", result: ok(makeAppAssetBundle()) }] }),
    );
  });

  it("returns 200 with one result per store outcome", async () => {
    call.mockResolvedValue(
      ok({
        outcomes: [
          { store: "play", result: ok(makeAppAssetBundle({ store: "play" })) },
          {
            store: "appstore",
            result: ok(makeAppAssetBundle({ store: "appstore" })),
          },
        ],
      }),
    );

    const res = await POST(makeRequest({ term: "whatsapp" }));
    const results = await resultsOf(res);

    expect(res.status).toBe(200);
    expect(results.map((r) => r.store)).toEqual(["play", "appstore"]);
    expect(results[0]?.bundle).toBeDefined();
  });

  it("passes the selected store for an id search", async () => {
    await POST(makeRequest({ store: "appstore", appId: "310633997" }));
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({ store: "appstore", appId: "310633997" }),
    );
  });

  it("defaults the store to play for an unknown value", async () => {
    await POST(makeRequest({ store: "nope", term: "whatsapp" }));
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({ store: "play" }),
    );
  });

  it("maps a per-store failure into the results array, still 200", async () => {
    call.mockResolvedValue(
      ok({
        outcomes: [
          { store: "play", result: err(new NotFoundError("No app found")) },
        ],
      }),
    );

    const res = await POST(makeRequest({ term: "ghost" }));
    const results = await resultsOf(res);

    expect(res.status).toBe(200);
    expect(results[0]?.error).toEqual({
      kind: "notFound",
      message: "No app found",
    });
    expect(results[0]?.bundle).toBeUndefined();
  });

  it("returns 400 when the use case rejects the input", async () => {
    call.mockResolvedValue(
      err(new ValidationError("Provide an app name or a store id.")),
    );
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 on a malformed JSON body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/assets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
  });
});
