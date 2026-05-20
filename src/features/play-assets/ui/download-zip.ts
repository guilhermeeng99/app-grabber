import type { ZipItem } from "@/features/play-assets/api/contracts";

/**
 * POST a set of (already size-scaled) image URLs to the ZIP route and trigger
 * a browser download of the result. Throws on a non-OK response so the caller
 * can surface a visible error instead of failing silently.
 */
export async function downloadZip(
  zipName: string,
  items: ZipItem[],
): Promise<void> {
  const response = await fetch("/api/download/zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zipName, items }),
  });
  if (!response.ok) {
    throw new Error(`ZIP request failed (${response.status})`);
  }
  triggerBlobDownload(await response.blob(), zipName);
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
