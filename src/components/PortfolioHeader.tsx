const links = [
  { href: "https://resume.saitotakuya0719.workers.dev", label: "職務経歴書" },
  { href: "https://github.com/tktk7l9", label: "GitHub" },
];

/** Same-site pages open in the same tab, without the new-tab icon (SHIG 59, 60). */
const internalLinks = [{ href: "/blog", label: "ブログ" }];

export function PortfolioHeader() {
  return (
    <header className="mb-8 sm:mb-12">
      <p className="text-xs font-medium tracking-widest text-indigo-400 sm:text-sm">
        PORTFOLIO
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
        齋藤拓也
      </h1>
      <p className="mt-1 text-sm text-slate-300 sm:text-base">
        フルスタックエンジニア（業務委託）
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
        React・Next.js を軸に、API・データベース・デプロイまでを一人で担当しています。
        テストと CI による品質の作り込み、パフォーマンスとセキュリティの計測改善を得意としています。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {internalLinks.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-indigo-500/15 px-4 text-sm font-medium text-indigo-200 ring-1 ring-indigo-400/20 transition-colors hover:bg-indigo-500/25 hover:text-white sm:min-h-9"
          >
            {label}
          </a>
        ))}
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-white/5 px-4 text-sm sm:min-h-9 font-medium text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            {label}
            <span className="sr-only">（新しいタブ）</span>
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
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
        ))}
      </div>
    </header>
  );
}
