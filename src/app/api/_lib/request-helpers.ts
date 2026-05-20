/**
 * Normalise a client-supplied locale code to a safe two-letter value,
 * falling back when absent or malformed. Defaulting locales is a boundary
 * concern, so it lives here rather than in the domain.
 */
export function normaliseLocale(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  return /^[a-z]{2}$/.test(trimmed) ? trimmed : fallback;
}

/**
 * Strip path separators and header-breaking characters from a download
 * file name so it cannot escape into the `Content-Disposition` header or
 * a directory path. Capped at 120 chars.
 */
export function sanitizeFileName(value: unknown, fallback = "image"): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\r\n"\\/]+/g, "").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}
