import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NetworkError, ValidationError } from "@/core/errors";
import { err } from "@/core/result";
import { jsonResult } from "@/app/api/_lib/respond";
import { sanitizeFileName } from "@/app/api/_lib/request-helpers";
import { isAllowedImageHost } from "@/features/play-assets/data/image-host";

export const runtime = "nodejs";

// Cap each upstream image fetch so a slow CDN cannot hold the connection open.
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Proxy a single store image so the browser receives it as a forced
 * download (`Content-Disposition: attachment`) — a cross-origin `<a
 * download>` to the CDN would otherwise just navigate. The `url` is
 * re-validated against the host allow-list to block SSRF.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");
  const fileName = sanitizeFileName(request.nextUrl.searchParams.get("name"));

  if (!url || !isAllowedImageHost(url)) {
    return jsonResult(
      err(new ValidationError("Missing or disallowed image URL.")),
    );
  }

  const upstream = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).catch(() => null);
  if (!upstream || !upstream.ok || !upstream.body) {
    return jsonResult(err(new NetworkError("Could not fetch the image.")));
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
