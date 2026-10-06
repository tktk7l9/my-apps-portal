import { loadPosts } from "@/lib/blog/load";
import { toIndexEntry } from "@/lib/blog/post";
import { absoluteUrl } from "@/lib/site";

// Machine-readable article index for agents (this portal is an agent-oriented portfolio).
// Built once from content/blog; see feed.xml/route.ts for why force-static.
export const dynamic = "force-static";

export function GET() {
  const posts = loadPosts().map((post) => ({ ...toIndexEntry(post), url: absoluteUrl(`/blog/${post.slug}`) }));
  return Response.json({ generatedAt: new Date().toISOString().slice(0, 10), count: posts.length, posts });
}
