import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/download/route";

const ALLOWED = "https://play-lh.googleusercontent.com/abc=s0";

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/download");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function imageResponse(bytes = new Uint8Array([1, 2, 3, 4])): Response {
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": "image/png" },
  });
}

describe("GET /api/download", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies an allowed image as a forced download", async () => {
    const fetchMock = vi.fn().mockResolvedValue(imageResponse());
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest({ url: ALLOWED, name: "icon.png" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="icon.png"',
    );
    expect(fetchMock).toHaveBeenCalledWith(ALLOWED);
    const body = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(body)).toEqual([1, 2, 3, 4]);
  });

  it("proxies an Apple mzstatic image (App Store CDN allow-list)", async () => {
    const apple = "https://is1-ssl.mzstatic.com/image/thumb/x/9999x9999bb.jpg";
    const fetchMock = vi.fn().mockResolvedValue(imageResponse());
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest({ url: apple, name: "icon.jpg" }));

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(apple);
  });

  it("rejects a disallowed host without fetching (SSRF guard)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(
      makeRequest({ url: "https://evil.example.com/x.png", name: "x.png" }),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the url is missing", async () => {
    const res = await GET(makeRequest({ name: "x.png" }));
    expect(res.status).toBe(400);
  });

  it("returns 502 when the upstream image cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );

    const res = await GET(makeRequest({ url: ALLOWED, name: "icon.png" }));
    expect(res.status).toBe(502);
  });

  it("sanitizes the download file name into the header", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));

    const res = await GET(
      makeRequest({ url: ALLOWED, name: 'a/b"c\nd.png' }),
    );

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="abcd.png"',
    );
  });
});
