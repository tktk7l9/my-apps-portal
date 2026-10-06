import type { BlogIndexEntry } from "@/lib/blog/post";
import { formatDateJa } from "@/lib/blog/post";

export type AppLabel = { id: string; name: string; emoji: string };

/**
 * One article in the list. The heading link is stretched over the card (::after) so the
 * whole card is a target (SHIG 78), while tag links stay above it (relative z-10).
 */
export function PostCard({ post, apps }: { post: BlogIndexEntry; apps: AppLabel[] }) {
  return (
    <article className="relative rounded-xl border border-white/8 bg-white/3 p-4 transition-colors hover:border-white/15 sm:p-5">
      <p className="text-xs tabular-nums text-muted">
        <time dateTime={post.date}>{formatDateJa(post.date)}</time>
        {post.updated && post.updated !== post.date && (
          <>
            {" "}
            <span aria-hidden="true">·</span> 更新 <time dateTime={post.updated}>{formatDateJa(post.updated)}</time>
          </>
        )}
      </p>
      <h2 className="mt-1.5 text-base font-bold leading-snug text-white sm:text-lg">
        <a
          href={`/blog/${post.slug}`}
          className="rounded after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-indigo-400"
        >
          {post.title}
        </a>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{post.summary}</p>
      {(apps.length > 0 || post.tags.length > 0) && (
        <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5" aria-label="関連アプリとタグ">
          {apps.map((app) => (
            <li key={app.id}>
              <a
                href={`/?work=${app.id}`}
                className="inline-flex min-h-7 items-center gap-1 rounded bg-indigo-500/15 px-2 text-xs text-indigo-200 ring-1 ring-indigo-400/20 transition-colors hover:bg-indigo-500/25"
                aria-label={`${app.name} をポートフォリオで見る`}
              >
                <span aria-hidden="true">{app.emoji}</span>
                {app.name}
              </a>
            </li>
          ))}
          {post.tags.map((tag) => (
            <li key={tag}>
              <a
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="inline-flex min-h-7 items-center rounded bg-white/5 px-2 text-xs text-slate-300 transition-colors hover:bg-white/10"
              >
                #{tag}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
