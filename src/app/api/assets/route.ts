import type { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors";
import { err } from "@/core/result";
import { jsonResult } from "@/app/api/_lib/respond";
import { normaliseLocale } from "@/app/api/_lib/request-helpers";
import type { AssetsRequestBody } from "@/features/play-assets/api/contracts";
import { getGrabAppAssetsUseCase } from "@/features/play-assets/di";

// google-play-scraper relies on got/cheerio (Node built-ins) — pin the
// Node.js runtime; the Edge runtime would fail to load it.
export const runtime = "nodejs";

/** Resolve an app (by term or package id) and return its asset bundle. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request
    .json()
    .catch(() => null)) as AssetsRequestBody | null;

  if (!body || typeof body !== "object") {
    return jsonResult(err(new ValidationError("Invalid JSON body.")));
  }

  const result = await getGrabAppAssetsUseCase().call({
    term: typeof body.term === "string" ? body.term : undefined,
    appId: typeof body.appId === "string" ? body.appId : undefined,
    country: normaliseLocale(body.country, "us"),
    lang: normaliseLocale(body.lang, "en"),
  });

  return jsonResult(result);
}
