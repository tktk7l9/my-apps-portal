// Pure helpers for the /api/ogp proxy. The route fetches a page and its og:image on the
// server, so it must only ever fetch pages the portal itself links to; otherwise it is an
// open proxy (SSRF, bandwidth abuse, arbitrary content served from this origin).

/** Upper bound for a proxied image. OGP images are typically well under 1 MB. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** True when `url` is exactly one of the allowed page URLs (the projects' liveUrl values). */
export function isAllowedPageUrl(url: string, allowed: readonly string[]): boolean {
  return allowed.includes(url);
}

/** Extracts og:image from HTML and resolves it against the page URL.
 *  Returns null unless the result is an http(s) URL. */
export function extractOgImage(html: string, pageUrl: string): string | null {
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (!/property=["']og:image["']/i.test(attrs)) continue;
    const content = attrs.match(/content=["']([^"']+)["']/i);
    if (!content) continue;
    let resolved: URL;
    try {
      resolved = new URL(content[1], pageUrl);
    } catch {
      return null;
    }
    return resolved.protocol === "https:" || resolved.protocol === "http:"
      ? resolved.toString()
      : null;
  }
  return null;
}

/** Only raster images are relayed. SVG can carry script, so it is refused. */
export function isAllowedImageType(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0].trim().toLowerCase();
  return type.startsWith("image/") && type !== "image/svg+xml";
}
