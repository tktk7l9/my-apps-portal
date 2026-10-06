import type { ReactNode } from "react";

/**
 * Page frame shared by /blog and /blog/[slug]: the same dark surface and gutters as the
 * portal, a header that always offers a way back (SHIG 59 wayfinding, 60 escape hatch,
 * 82 back link) and a footer with the GitHub link like the home page.
 *
 * Blog pages are plain static HTML served as Workers assets, so internal links are
 * ordinary <a> elements: next/link would prefetch RSC payloads that the asset layer
 * cannot answer.
 */
export function BlogShell({ children, trail }: { children: ReactNode; trail?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 border-b border-white/5 pb-4">
          <nav aria-label="パンくず" className="flex flex-wrap items-center gap-x-1 text-sm">
            <a href="/" className={trailLinkClass}>
              <BackIcon />
              ポートフォリオ
            </a>
            {trail && (
              <>
                <span aria-hidden="true" className="text-muted">
                  /
                </span>
                {trail}
              </>
            )}
          </nav>
        </header>

        {children}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-400">
          <a href="/" className="inline-flex min-h-11 items-center gap-1 px-1 transition-colors hover:text-slate-200">
            <BackIcon />
            ポートフォリオに戻る
          </a>
          <a
            href="https://github.com/tktk7l9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-slate-200"
          >
            github.com/tktk7l9
            <span className="sr-only">（新しいタブ）</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

/** Breadcrumb link style, exported so the article page can add "開発ブログ" to the trail. */
export const trailLinkClass =
  "inline-flex min-h-11 items-center gap-1 rounded px-1 text-slate-300 underline-offset-4 transition-colors hover:text-white hover:underline";

function BackIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
