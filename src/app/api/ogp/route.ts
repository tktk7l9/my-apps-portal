import type { NextRequest } from "next/server";

function extractOgImage(html: string): string | null {
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (/property=["']og:image["']/i.test(attrs)) {
      const content = attrs.match(/content=["']([^"']+)["']/i);
      if (content) return content[1];
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new Response(null, { status: 400 });

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

  const imageUrl = extractOgImage(html);
  if (!imageUrl) return new Response(null, { status: 404 });

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { next: { revalidate: 86400 } });
    if (!imgRes.ok) return new Response(null, { status: 502 });
  } catch {
    return new Response(null, { status: 502 });
  }

  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
  const body = await imgRes.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
