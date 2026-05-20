/**
 * SSRF guard + store detection for image URLs. The download proxy and ZIP
 * routes restrict server-side fetches to the two stores' image CDNs over
 * HTTPS; anything else (other host, plain HTTP, malformed URL) is rejected
 * so a crafted `url` parameter cannot make the server fetch internal
 * resources.
 */

// Google Play serves every listing image from this single CDN host.
const PLAY_IMAGE_HOST = "play-lh.googleusercontent.com";

// Apple serves artwork/screenshots from its image CDN, sharded across
// is1-ssl..is5-ssl (and similar) subdomains of mzstatic.com.
const APP_STORE_HOST_SUFFIX = ".mzstatic.com";

/**
 * True when the URL points at Apple's image CDN. Used to pick the App
 * Store resolver in `image-url.ts`. A suffix match (not `includes`) is
 * deliberate: "is1-ssl.mzstatic.com" passes, "mzstatic.com.evil.com" does
 * not (it ends with ".evil.com").
 */
export function isAppStoreImageHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(APP_STORE_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Server-side fetch allow-list. HTTPS only, and the host must be the Play
 * CDN or a subdomain of mzstatic.com. The suffix check is what blocks
 * look-alike hosts such as "mzstatic.com.evil.com".
 */
export function isAllowedImageHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    return host === PLAY_IMAGE_HOST || host.endsWith(APP_STORE_HOST_SUFFIX);
  } catch {
    return false;
  }
}
