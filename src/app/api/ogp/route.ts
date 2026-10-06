import type { NextRequest } from "next/server";
import { rawProjects } from "@/lib/projects";
import {
  FETCH_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
  MAX_PAGE_BYTES,
  extractOgImage,
  isAllowedImageType,
  isAllowedImageUrl,
  isAllowedPageUrl,
  readBounded,
} from "@/lib/ogp";

// Only the portal's own project pages may be fetched (see src/lib/ogp.ts).
const allowedPageUrls = rawProjects
  .map((project) => project.liveUrl)
  .filter((url): url is string => typeof url === "string");

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new Response(null, { status: 400 });
  if (!isAllowedPageUrl(url, allowedPageUrls)) return new Response(null, { status: 403 });

  let html: string;
  // The page may redirect (e.g. to a locale prefix); relative og:image values are resolved
  // against the URL that actually answered.
  let pageUrl = url;
  try {
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OGPBot/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!pageRes.ok) return new Response(null, { status: 502 });
    const bytes = await readBounded(pageRes.body, MAX_PAGE_BYTES);
    if (!bytes) return new Response(null, { status: 502 });
    html = new TextDecoder().decode(bytes);
    if (pageRes.url) pageUrl = pageRes.url;
  } catch {
    return new Response(null, { status: 502 });
  }

  const imageUrl = extractOgImage(html, pageUrl);
  if (!imageUrl) return new Response(null, { status: 404 });
  if (!isAllowedImageUrl(imageUrl, pageUrl)) return new Response(null, { status: 502 });

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!imgRes.ok) return new Response(null, { status: 502 });
  } catch {
    return new Response(null, { status: 502 });
  }
  // A redirect must not leave the page's host either
  if (imgRes.url && !isAllowedImageUrl(imgRes.url, pageUrl)) return new Response(null, { status: 502 });

  const contentType = imgRes.headers.get("content-type");
  if (!isAllowedImageType(contentType)) return new Response(null, { status: 502 });
  const declaredLength = Number(imgRes.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) return new Response(null, { status: 502 });
  const body = await readBounded(imgRes.body, MAX_IMAGE_BYTES);
  if (!body) return new Response(null, { status: 502 });

  return new Response(body, {
    headers: {
      "Content-Type": contentType as string,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
