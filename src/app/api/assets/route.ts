import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors";
import { err } from "@/core/result";
import { jsonResult } from "@/app/api/_lib/respond";
import { normaliseLocale } from "@/app/api/_lib/request-helpers";
import type {
  AssetsRequestBody,
  StoreGrabResultDTO,
} from "@/features/play-assets/api/contracts";
import { getGrabFromStoresUseCase } from "@/features/play-assets/di";

// The scrapers rely on got/cheerio/request (Node built-ins) — pin the
// Node.js runtime; the Edge runtime would fail to load them.
export const runtime = "nodejs";

/**
 * Resolve an app and return its assets. A name search resolves both stores
 * (one result each); an id search resolves the single selected store.
 * Per-store failures live inside `results`; only request-level problems
 * (no input, malformed JSON) produce a top-level error envelope.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request
    .json()
    .catch(() => null)) as AssetsRequestBody | null;

  if (!body || typeof body !== "object") {
    return jsonResult(err(new ValidationError("Invalid JSON body.")));
  }

  // `store` only matters in id mode; a name search queries both stores.
  const store = body.store === "appstore" ? "appstore" : "play";

  const result = await getGrabFromStoresUseCase().call({
    term: typeof body.term === "string" ? body.term : undefined,
    appId: typeof body.appId === "string" ? body.appId : undefined,
    store,
    country: normaliseLocale(body.country, "us"),
    lang: normaliseLocale(body.lang, "en"),
  });

  if (!result.ok) return jsonResult(result);

  const results: StoreGrabResultDTO[] = result.value.outcomes.map((outcome) =>
    outcome.result.ok
      ? { store: outcome.store, bundle: outcome.result.value }
      : {
          store: outcome.store,
          error: {
            kind: outcome.result.error.kind,
            message: outcome.result.error.message,
          },
        },
  );

  return NextResponse.json({ results });
}
