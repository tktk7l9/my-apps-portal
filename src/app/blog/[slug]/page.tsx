import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShell, trailLinkClass } from "@/components/blog/BlogShell";
import { RelatedApps } from "@/components/blog/RelatedApps";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { listSlugs, loadPosts, readPost } from "@/lib/blog/load";
import { formatDateJa } from "@/lib/blog/post";
import { renderMarkdown } from "@/lib/blog/render";
import { blogListHref } from "@/lib/blog/tag-param";
import { rawProjects } from "@/lib/projects";
import { absoluteUrl, BLOG_TITLE, SITE_NAME } from "@/lib/site";

type Params = { slug: string };

// Every article is rendered at build time from content/blog; unknown slugs are 404
// (there is no content directory to read at request time on the Worker).
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = readPost(slug);
  const url = absoluteUrl(`/blog/${slug}`);
  return {
    title: `${post.title} — ${BLOG_TITLE} | ${SITE_NAME}`,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogArticle({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const posts = loadPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const post = posts[index];
  // posts are newest first, so "newer" is the previous index.
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index < posts.length - 1 ? posts[index + 1] : null;

  const { html, headings } = await renderMarkdown(post.body);
  const projects = post.apps
    .map((id) => rawProjects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: "齋藤拓也", url: absoluteUrl("/") },
    mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
    keywords: post.tags.join(","),
    inLanguage: "ja",
  };

  return (
    <BlogShell
      trail={
        <a href="/blog" className={trailLinkClass}>
          {BLOG_TITLE}
        </a>
      }
    >
      <main>
        <article>
          <header>
            <p className="text-xs tabular-nums text-muted">
              公開 <time dateTime={post.date}>{formatDateJa(post.date)}</time>
              {post.updated && post.updated !== post.date && (
                <>
                  {" "}
                  <span aria-hidden="true">·</span> 更新 <time dateTime={post.updated}>{formatDateJa(post.updated)}</time>
                </>
              )}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">{post.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-slate-400">{post.summary}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="タグ">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <a
                    href={blogListHref(tag)}
                    className="inline-flex min-h-7 items-center rounded bg-white/5 px-2 text-xs text-slate-300 transition-colors hover:bg-white/10"
                  >
                    #{tag}
                  </a>
                </li>
              ))}
            </ul>
          </header>

          <TableOfContents headings={headings} />

          {/* Sanitised at build time by rehype-sanitize (see src/lib/blog/render.ts) */}
          <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <RelatedApps projects={projects} />

        <nav aria-label="前後の記事" className="mt-12 grid gap-3 sm:grid-cols-2">
          {older && <AdjacentLink label="古い記事" post={older} align="left" />}
          {newer && <AdjacentLink label="新しい記事" post={newer} align="right" />}
        </nav>

        {/* Data block (not executed, outside script-src); "<" is escaped so no "</script>" can appear */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </main>
    </BlogShell>
  );
}

function AdjacentLink({ label, post, align }: { label: string; post: { slug: string; title: string }; align: "left" | "right" }) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className={`flex min-h-11 flex-col justify-center rounded-xl border border-white/8 bg-white/3 px-4 py-3 transition-colors hover:border-white/15 ${
        align === "right" ? "sm:col-start-2 sm:text-right" : ""
      }`}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium text-slate-200">{post.title}</span>
    </a>
  );
}
