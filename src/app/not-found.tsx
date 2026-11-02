import type { Metadata } from "next";
import { BlogShell } from "@/components/blog/BlogShell";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: true },
};

const linkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors";

/**
 * 404 for unmatched URLs. Next's default page is English, has no <main> landmark
 * (axe: landmark-one-main, region) and no way back; this one reuses the blog frame, which
 * already offers the back link, and adds two exits (SHIG 11, 59, 60, 82).
 * Plain <a> like the blog: the targets are static assets, so next/link's RSC prefetch would get HTML.
 */
export default function NotFound() {
  return (
    <BlogShell>
      <main>
        <p className="text-xs font-medium tracking-widest text-indigo-400 sm:text-sm">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">ページが見つかりません</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          URL が変わったか、ページが削除された可能性があります。作品の一覧か開発ブログから探してください。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/" className={`${linkClass} bg-indigo-600 text-white hover:bg-indigo-500`}>
            作品の一覧へ
          </a>
          <a href="/blog" className={`${linkClass} border border-white/10 text-slate-200 hover:bg-white/5`}>
            開発ブログへ
          </a>
        </div>
      </main>
    </BlogShell>
  );
}
