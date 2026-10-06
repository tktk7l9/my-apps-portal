import { buildRssFeed } from "@/lib/blog/feed";
import { loadPosts } from "@/lib/blog/load";
import { absoluteUrl, BLOG_DESCRIPTION, BLOG_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";

// GET route handlers are dynamic by default since Next 15; this one must be built once
// from content/blog, which does not exist on the Worker.
export const dynamic = "force-static";

export function GET() {
  const xml = buildRssFeed({
    title: `${BLOG_TITLE} — ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    siteUrl: absoluteUrl("/blog"),
    feedUrl: absoluteUrl("/blog/feed.xml"),
    language: "ja",
    items: loadPosts().map((post) => ({
      title: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      description: post.summary,
      date: post.date,
      categories: post.tags,
    })),
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
