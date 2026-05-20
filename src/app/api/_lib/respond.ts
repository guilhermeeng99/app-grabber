import { NextResponse } from "next/server";
import { toHttpStatus } from "@/core/errors";
import type { Result } from "@/core/result";
import type { ApiErrorBody } from "@/features/play-assets/api/contracts";

/**
 * Serialise a domain `Result` into a JSON response: the value on success,
 * or the uniform error envelope with the kind-derived HTTP status on
 * failure. The single place route handlers translate domain → HTTP.
 */
export function jsonResult<T>(result: Result<T>): NextResponse {
  if (result.ok) {
    return NextResponse.json(result.value);
  }
  const { kind, message } = result.error;
  const body: ApiErrorBody = { error: { kind, message } };
  return NextResponse.json(body, { status: toHttpStatus(kind) });
}
