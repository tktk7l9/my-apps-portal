"use client";

import { useSyncExternalStore } from "react";
import type { BlogIndexEntry } from "@/lib/blog/post";
import { collectTags, filterByTag } from "@/lib/blog/post";
import { blogListHref, readTagParam } from "@/lib/blog/tag-param";
import { PostCard, type AppLabel } from "@/components/blog/PostCard";

/**
 * Article list with a tag filter. The page is static HTML, so the active tag lives in
 * `?tag=` (SHIG 59: the URL is the state; a filtered view can be shared and the browser
 * back button undoes it). The server renders the full list; the client narrows it.
 *
 * The active chip is marked with aria-current and a check mark, not colour alone (SHIG 96).
 */
function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const getSnapshot = () => readTagParam(window.location.search);
const getServerSnapshot = () => null;
const MIN_CHIP_COUNT = 2;

export function PostList({ posts, appLabels }: { posts: BlogIndexEntry[]; appLabels: Record<string, AppLabel> }) {
  const activeTag = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const tags = collectTags(posts);
  const known = activeTag !== null && tags.some((t) => t.tag === activeTag);
  const visible = filterByTag(posts, known ? activeTag : null);
  // Tags used by a single article are still linked from that article's card, but as
  // filter chips they are noise (SHIG 1), so only shared tags (or the active one) are offered.
  const chips = tags.filter((t) => t.count >= MIN_CHIP_COUNT || t.tag === activeTag);

  return (
    <>
      <nav aria-label="タグで絞り込む" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <TagChip href={blogListHref(null)} active={!known} label="すべて" count={posts.length} />
          </li>
          {chips.map(({ tag, count }) => (
            <li key={tag}>
              <TagChip href={blogListHref(tag)} active={known && activeTag === tag} label={`#${tag}`} count={count} />
            </li>
          ))}
        </ul>
        {activeTag !== null && !known && (
          <p className="mt-3 text-sm text-slate-400" role="status">
            「{activeTag}」というタグの記事はありません。すべての記事を表示しています。
          </p>
        )}
      </nav>

      <p className="mb-4 text-sm text-muted tabular-nums" aria-live="polite">
        {known ? `#${activeTag} の記事 ${visible.length} 件` : `全 ${visible.length} 件`}
      </p>

      <div className="grid gap-4">
        {visible.map((post) => (
          <PostCard key={post.slug} post={post} apps={post.apps.map((id) => appLabels[id]).filter(Boolean)} />
        ))}
      </div>
    </>
  );
}

function TagChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 items-center gap-1 rounded-md px-3 text-sm ring-1 transition-colors ${
        active
          ? "bg-indigo-500/20 font-medium text-white ring-indigo-400/40"
          : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {active && (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {label}
      <span className="text-xs text-muted tabular-nums">{count}</span>
    </a>
  );
}
