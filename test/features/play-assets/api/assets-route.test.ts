import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ok } from "@/core/result";
import { POST } from "@/app/api/assets/route";
import { getGrabAppAssetsUseCase } from "@/features/play-assets/di";
import { makeAppAssetBundle } from "../../../harness/factories/app-asset-factory";

// The route's only job beyond validation is to pick the store and delegate,
// so the composition root is mocked and asserted directly.
vi.mock("@/features/play-assets/di", () => ({
  getGrabAppAssetsUseCase: vi.fn(),
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/assets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/assets", () => {
  const call = vi.fn();

  beforeEach(() => {
    vi.mocked(getGrabAppAssetsUseCase).mockReturnValue({
      call,
    } as unknown as ReturnType<typeof getGrabAppAssetsUseCase>);
    call.mockResolvedValue(ok(makeAppAssetBundle()));
  });

  it("selects the App Store when store is 'appstore'", async () => {
    await POST(makeRequest({ store: "appstore", term: "whatsapp" }));
    expect(getGrabAppAssetsUseCase).toHaveBeenCalledWith("appstore");
  });

  it("defaults to Play when store is omitted", async () => {
    await POST(makeRequest({ term: "whatsapp" }));
    expect(getGrabAppAssetsUseCase).toHaveBeenCalledWith("play");
  });

  it("falls back to Play for an unknown store value", async () => {
    await POST(makeRequest({ store: "nope", term: "whatsapp" }));
    expect(getGrabAppAssetsUseCase).toHaveBeenCalledWith("play");
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
