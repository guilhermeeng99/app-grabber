/**
 * Lowercase, hyphenate and trim a string into a filesystem- and
 * URL-safe slug capped at 60 chars. Used for the ZIP file name. Ported
 * verbatim from the original CLI so existing naming stays stable.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
