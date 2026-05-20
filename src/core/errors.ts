/**
 * Sealed error hierarchy — the analogue of financo's sealed `Failure`
 * classes. Each kind maps to an HTTP status at the API boundary
 * (see `toHttpStatus`) and carries a user-safe `message`.
 */
export type AppErrorKind = "validation" | "notFound" | "network" | "server";

export abstract class AppError extends Error {
  abstract readonly kind: AppErrorKind;

  protected constructor(message: string) {
    super(message);
    // Without this the name is always "Error" once transpiled.
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly kind = "validation" as const;

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly kind = "notFound" as const;

  constructor(message: string) {
    super(message);
  }
}

export class NetworkError extends AppError {
  readonly kind = "network" as const;

  constructor(message: string) {
    super(message);
  }
}

export class ServerError extends AppError {
  readonly kind = "server" as const;

  constructor(message: string) {
    super(message);
  }
}

/** Map an error kind onto the HTTP status the API should respond with. */
export function toHttpStatus(kind: AppErrorKind): number {
  switch (kind) {
    case "validation":
      return 400;
    case "notFound":
      return 404;
    case "network":
      return 502;
    case "server":
      return 500;
  }
}
