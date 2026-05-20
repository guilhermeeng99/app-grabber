import { Readable } from "node:stream";
import archiver from "archiver";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors";
import { err } from "@/core/result";
import { jsonResult } from "@/app/api/_lib/respond";
import { sanitizeFileName } from "@/app/api/_lib/request-helpers";
import type { ZipRequestBody } from "@/features/play-assets/api/contracts";
import { isAllowedImageHost } from "@/features/play-assets/data/image-host";

export const runtime = "nodejs";

// Guard against an oversized request fanning out into many server fetches.
const MAX_ITEMS = 100;

// Cap each upstream image fetch so a slow CDN cannot stall the ZIP stream.
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Stream a set of images as a single ZIP. The client supplies the (already
 * size-scaled) image URLs and file names; the server re-validates every
 * URL against the host allow-list before fetching it, so a crafted body
 * still cannot trigger SSRF. A failed item is skipped, not fatal.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request
    .json()
    .catch(() => null)) as ZipRequestBody | null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (items.length === 0) {
    return jsonResult(err(new ValidationError("No assets to download.")));
  }
  if (items.length > MAX_ITEMS) {
    return jsonResult(err(new ValidationError("Too many assets requested.")));
  }

  let zipName = sanitizeFileName(body?.zipName, "assets");
  if (!zipName.toLowerCase().endsWith(".zip")) zipName += ".zip";

  const archive = archiver("zip", { zlib: { level: 9 } });
  const webStream = Readable.toWeb(
    archive,
  ) as unknown as ReadableStream<Uint8Array>;

  void (async () => {
    try {
      for (const item of items) {
        if (!item || typeof item.url !== "string") continue;
        if (!isAllowedImageHost(item.url)) continue;
        const res = await fetch(item.url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }).catch(() => null);
        if (!res || !res.ok) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        archive.append(buffer, { name: sanitizeFileName(item.fileName) });
      }
      await archive.finalize();
    } catch {
      archive.abort();
    }
  })();

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
