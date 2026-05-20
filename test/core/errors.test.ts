import { describe, expect, it } from "vitest";
import {
  NetworkError,
  NotFoundError,
  ServerError,
  ValidationError,
  toHttpStatus,
} from "@/core/errors";

describe("errors", () => {
  it("maps each kind to its HTTP status", () => {
    expect(toHttpStatus("validation")).toBe(400);
    expect(toHttpStatus("notFound")).toBe(404);
    expect(toHttpStatus("network")).toBe(502);
    expect(toHttpStatus("server")).toBe(500);
  });

  it("tags each error with its kind", () => {
    expect(new ValidationError("x").kind).toBe("validation");
    expect(new NotFoundError("x").kind).toBe("notFound");
    expect(new NetworkError("x").kind).toBe("network");
    expect(new ServerError("x").kind).toBe("server");
  });

  it("preserves the message and is an Error instance", () => {
    const error = new ServerError("boom");
    expect(error.message).toBe("boom");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ServerError");
  });
});
