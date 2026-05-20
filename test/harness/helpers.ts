import type { AppError } from "@/core/errors";
import type { Result } from "@/core/result";

/** Assert a Result is Ok and return its value (throws otherwise). */
export function expectOk<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(`Expected Ok, got Err: ${result.error.message}`);
  }
  return result.value;
}

/** Assert a Result is Err and return its error (throws otherwise). */
export function expectErr<T>(result: Result<T>): AppError {
  if (result.ok) {
    throw new Error("Expected Err, got Ok");
  }
  return result.error;
}
