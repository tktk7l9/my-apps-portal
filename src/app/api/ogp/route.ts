import type { NextRequest } from "next/server";
import { rawProjects } from "@/lib/projects";
import {
  MAX_IMAGE_BYTES,
  extractOgImage,
  isAllowedImageType,
  isAllowedPageUrl,
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
  try {
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OGPBot/1.0)" },
      next: { revalidate: 86400 },
    });
    if (!pageRes.ok) return new Response(null, { status: 502 });
    html = await pageRes.text();
  } catch {
    return new Response(null, { status: 502 });
  }

  const imageUrl = extractOgImage(html, url);
  if (!imageUrl) return new Response(null, { status: 404 });

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { next: { revalidate: 86400 } });
    if (!imgRes.ok) return new Response(null, { status: 502 });
  } catch {
    return new Response(null, { status: 502 });
  }

  const contentType = imgRes.headers.get("content-type");
  if (!isAllowedImageType(contentType)) return new Response(null, { status: 502 });
  const declaredLength = Number(imgRes.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) return new Response(null, { status: 502 });
  const body = await imgRes.arrayBuffer();
  if (body.byteLength > MAX_IMAGE_BYTES) return new Response(null, { status: 502 });

  return new Response(body, {
    headers: {
      "Content-Type": contentType as string,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
