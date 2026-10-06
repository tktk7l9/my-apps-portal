// Pure helpers for the /api/ogp proxy. The route fetches a page and its og:image on the
// server, so it must only ever fetch pages the portal itself links to; otherwise it is an
// open proxy (SSRF, bandwidth abuse, arbitrary content served from this origin).

/** Upper bound for a proxied image. OGP images are typically well under 1 MB. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Upper bound for the HTML page that is scanned for og:image. */
export const MAX_PAGE_BYTES = 1024 * 1024;

/** Each upstream fetch (page, image) is abandoned after this long. */
export const FETCH_TIMEOUT_MS = 10_000;

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

/**
 * True when `imageUrl` is an https URL on the same host as `pageUrl`.
 * The page itself is allowlisted, but its og:image is content under that site's control;
 * pinning the image to the page's host keeps a compromised or misconfigured site from
 * turning this route into a relay for arbitrary hosts. Applied to the final URL after
 * redirects as well, so a redirect cannot escape the host either.
 */
export function isAllowedImageUrl(imageUrl: string, pageUrl: string): boolean {
  let image: URL;
  let page: URL;
  try {
    image = new URL(imageUrl);
    page = new URL(pageUrl);
  } catch {
    return false;
  }
  return image.protocol === "https:" && image.host === page.host;
}

/** Only raster images are relayed. SVG can carry script, so it is refused. */
export function isAllowedImageType(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0].trim().toLowerCase();
  return type.startsWith("image/") && type !== "image/svg+xml";
}

/**
 * Reads a response body up to `maxBytes`. Returns null as soon as the body exceeds the
 * limit, so an upstream without (or lying about) Content-Length cannot make the Worker
 * buffer an unbounded body.
 */
export async function readBounded(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!body) return new Uint8Array(new ArrayBuffer(0));
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
