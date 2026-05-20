import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/download/zip/route";

const ALLOWED = "https://play-lh.googleusercontent.com/abc=s0";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/download/zip", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A fresh Response per call: the body is a one-shot stream, so two items
// sharing one instance would fail on the second read.
function imageFetchMock() {
  return vi.fn(() =>
    Promise.resolve(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    ),
  );
}

/**
 * Read the response body to completion (draining the stream is what lets
 * the route's background archiver finish) and return its first `n` bytes.
 */
async function drainFirstBytes(res: Response, n: number): Promise<string> {
  const buffer = new Uint8Array(await res.arrayBuffer());
  return String.fromCharCode(...buffer.slice(0, n));
}

describe("POST /api/download/zip", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("streams a ZIP archive of the requested items", async () => {
    const fetchMock = imageFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({
        zipName: "test.zip",
        items: [
          { url: ALLOWED, fileName: "icon.png" },
          { url: ALLOWED, fileName: "feature.png" },
        ],
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="test.zip"',
    );
    // ZIP archives begin with the local-file-header magic "PK".
    const magic = await drainFirstBytes(res, 2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(magic).toBe("PK");
  });

  it("appends .zip when the requested name lacks the extension", async () => {
    vi.stubGlobal("fetch", imageFetchMock());

    const res = await POST(
      makeRequest({
        zipName: "myapp",
        items: [{ url: ALLOWED, fileName: "icon.png" }],
      }),
    );

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="myapp.zip"',
    );
    await res.arrayBuffer(); // let the background archiver finish
  });

  it("returns 400 for an empty item list", async () => {
    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { kind: string } };
    expect(body.error.kind).toBe("validation");
  });

  it("returns 400 when more than 100 items are requested", async () => {
    const items = Array.from({ length: 101 }, () => ({
      url: ALLOWED,
      fileName: "x.png",
    }));
    const res = await POST(makeRequest({ items }));
    expect(res.status).toBe(400);
  });

  it("skips disallowed hosts but still returns a ZIP (SSRF guard)", async () => {
    const fetchMock = imageFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({
        items: [
          { url: "https://evil.example.com/x.png", fileName: "x.png" },
          { url: ALLOWED, fileName: "icon.png" },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const magic = await drainFirstBytes(res, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      ALLOWED,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(magic).toBe("PK");
  });
});
