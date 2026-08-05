import type { PortfolioStats } from "@/lib/stats";

export function StatsSummary({ stats }: { stats: PortfolioStats }) {
  const items: { label: string; value: string }[] = [
    { label: "作品数", value: `${stats.totalProjects}` },
    { label: "公開中", value: `${stats.liveProjects}` },
    { label: "テスト総数", value: stats.totalTests.toLocaleString("ja-JP") },
  ];

  if (stats.lighthouseMeasuredCount > 0) {
    items.push({
      label: "Lighthouse 90+",
      value: `${stats.lighthouse90Count}/${stats.lighthouseMeasuredCount}`,
    });
  }

  if (stats.avgLighthousePerformance !== null) {
    items.push({
      label: "Lighthouse Performance 平均",
      value: `${stats.avgLighthousePerformance}`,
    });
  }

  return (
    <section aria-label="実績サマリ" className="mb-10 sm:mb-14">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/8 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-[#0b1018] px-4 py-4 sm:px-5 sm:py-5">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        各作品の最新の計測値から自動集計しています。
        {stats.oldestMeasuredAt && stats.newestMeasuredAt && (
          <>
            {" "}計測日は作品ごとに異なります（
            {stats.oldestMeasuredAt === stats.newestMeasuredAt
              ? stats.oldestMeasuredAt
              : `${stats.oldestMeasuredAt} 〜 ${stats.newestMeasuredAt}`}
            ）。
          </>
        )}
      </p>
    </section>
  );
}
