import type { AppError } from "@/core/errors";

/**
 * Functional result type — the project's analogue of financo's
 * `Either<Failure, T>`. Every fallible boundary (data source, repository,
 * use case) returns a `Result` instead of throwing, so callers must
 * handle the failure path explicitly. `E` defaults to `AppError`.
 */
export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Map the success value, passing failures through untouched. */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
