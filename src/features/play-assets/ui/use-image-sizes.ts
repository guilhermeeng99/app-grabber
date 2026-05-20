"use client";

import { useEffect, useState } from "react";

export interface PixelSize {
  w: number;
  h: number;
}

/**
 * Measure the true pixel dimensions of each image URL by loading it in
 * the background. This is the only reliable way to learn an asset's real
 * resolution: the optimized preview would report its scaled-down size,
 * not the original. Returns a map keyed by URL, filled in as images load.
 */
export function useImageSizes(
  urls: readonly string[],
): Record<string, PixelSize> {
  const [sizes, setSizes] = useState<Record<string, PixelSize>>({});
  // Serialise the list so the effect re-runs only when the set changes,
  // not on every render (a fresh array would loop forever).
  const key = urls.join("|");

  useEffect(() => {
    let active = true;
    const images = urls.map((url) => {
      const img = new window.Image();
      img.onload = () => {
        if (!active) return;
        setSizes((prev) =>
          prev[url]
            ? prev
            : { ...prev, [url]: { w: img.naturalWidth, h: img.naturalHeight } },
        );
      };
      img.src = url;
      return img;
    });
    return () => {
      active = false;
      images.forEach((img) => {
        img.onload = null;
      });
    };
    // `key` captures every dependency of this effect; `urls` itself is a
    // new array each render and would cause an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return sizes;
}
