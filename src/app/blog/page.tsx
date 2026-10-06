import type { Metadata } from "next";
import { BlogShell } from "@/components/blog/BlogShell";
import { PostList } from "@/components/blog/PostList";
import type { AppLabel } from "@/components/blog/PostCard";
import { loadPosts } from "@/lib/blog/load";
import { toIndexEntry } from "@/lib/blog/post";
import { rawProjects } from "@/lib/projects";
import { absoluteUrl, BLOG_DESCRIPTION, BLOG_TITLE, SITE_NAME } from "@/lib/site";

const title = `${BLOG_TITLE} — ${SITE_NAME}`;

export const metadata: Metadata = {
  title,
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/blog"),
    types: { "application/rss+xml": absoluteUrl("/blog/feed.xml") },
  },
  openGraph: { title, description: BLOG_DESCRIPTION, url: absoluteUrl("/blog"), type: "website" },
};

export default function BlogIndex() {
  const posts = loadPosts().map(toIndexEntry);
  const appLabels: Record<string, AppLabel> = Object.fromEntries(
    rawProjects.map((p) => [p.id, { id: p.id, name: p.name, emoji: p.emoji }]),
  );

  return (
    <BlogShell>
      <main>
        <p className="text-xs font-medium tracking-widest text-indigo-400 sm:text-sm">BLOG</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{BLOG_TITLE}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{BLOG_DESCRIPTION}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
          <a href="/blog/feed.xml" className="inline-flex min-h-9 items-center underline-offset-4 hover:text-slate-200 hover:underline">
            RSS
          </a>
          <a href="/blog/index.json" className="inline-flex min-h-9 items-center underline-offset-4 hover:text-slate-200 hover:underline">
            JSON（エージェント向け）
          </a>
        </p>
        <div className="mt-8">
          <PostList posts={posts} appLabels={appLabels} />
        </div>
      </main>
    </BlogShell>
  );
}
