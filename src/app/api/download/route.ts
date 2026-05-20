import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sanitizeFileName } from "@/app/api/_lib/request-helpers";
import { isAllowedImageHost } from "@/features/play-assets/data/play-image-url";

export const runtime = "nodejs";

/**
 * Proxy a single Play image so the browser receives it as a forced
 * download (`Content-Disposition: attachment`) — a cross-origin `<a
 * download>` to googleusercontent would otherwise just navigate. The
 * `url` is re-validated against the host allow-list to block SSRF.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");
  const fileName = sanitizeFileName(request.nextUrl.searchParams.get("name"));

  if (!url || !isAllowedImageHost(url)) {
    return NextResponse.json(
      {
        error: {
          kind: "validation",
          message: "Missing or disallowed image URL.",
        },
      },
      { status: 400 },
    );
  }

  const upstream = await fetch(url).catch(() => null);
  if (!upstream || !upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: { kind: "network", message: "Could not fetch the image." } },
      { status: 502 },
    );
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
