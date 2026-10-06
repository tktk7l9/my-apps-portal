import type { MetadataRoute } from "next";
import { loadPosts } from "@/lib/blog/load";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = loadPosts();
  const newest = posts[0]?.updated ?? posts[0]?.date;
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
