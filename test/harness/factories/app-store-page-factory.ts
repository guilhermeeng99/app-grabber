const MZ = "https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/ab/cd/ef";

/** One screenshot shelf entry; overrides target the field under test. */
interface ShotSpec {
  template?: string;
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
}

interface PageSpec {
  phone?: ShotSpec[];
  ipad?: ShotSpec[];
}

function makeShot(spec: ShotSpec) {
  return {
    $kind: "Artwork",
    template: spec.template ?? `${MZ}/phone.png/{w}x{h}{c}.{f}`,
    width: spec.width ?? 1290,
    height: spec.height ?? 2796,
    crop: spec.crop ?? "bb",
    variants: [{ format: spec.format ?? "jpeg" }],
  };
}

/**
 * Builds a minimal App Store listing page carrying the `serialized-server-data`
 * blob `appstore-page-screenshots.ts` parses (financo rule: never hardcode
 * fixtures inline). Defaults give two iPhone + one iPad shelf entry; pass
 * empty arrays for the "page also has no screenshots" case.
 */
export function makeAppStorePageHtml(spec: PageSpec = {}): string {
  const toItems = (shots: ShotSpec[]) =>
    shots.map((s) => ({ screenshot: makeShot(s) }));
  const phone = toItems(spec.phone ?? [{}, {}]);
  const ipad = toItems(
    spec.ipad ?? [
      { template: `${MZ}/ipad.png/{w}x{h}{c}.{f}`, width: 2048, height: 2732 },
    ],
  );
  const blob = JSON.stringify([
    {
      data: {
        shelfMapping: {
          product_media_phone_: { items: phone },
          product_media_pad_: { items: ipad },
        },
      },
    },
  ]);
  return `<!doctype html><html><body><script type="application/json" id="serialized-server-data">${blob}</script></body></html>`;
}
