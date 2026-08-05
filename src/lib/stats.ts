import type { RawProject } from "@/lib/projects";

export type PortfolioStats = {
  /** 個人開発作品の総数（kind: "client" を除く） */
  totalProjects: number;
  /** liveUrl を持つ作品数 */
  liveProjects: number;
  /** testCoverage.tests の合計 */
  totalTests: number;
  /** npm audit の critical + high + moderate + low の合計 */
  totalVulnerabilities: number;
  /** gitleaks 検出数の合計 */
  totalSecretLeaks: number;
  /** Lighthouse Performance の平均（小数第1位）。対象 0 件なら null */
  avgLighthousePerformance: number | null;
  /** Performance 90 以上の件数 */
  lighthouse90Count: number;
  /** lighthouseScores を持つ件数 */
  lighthouseMeasuredCount: number;
  /** 集計に寄与した計測値のうち最も古い measuredAt（YYYY-MM-DD）。対象が無ければ null */
  oldestMeasuredAt: string | null;
  /** 集計に寄与した計測値のうち最も新しい measuredAt（YYYY-MM-DD）。対象が無ければ null */
  newestMeasuredAt: string | null;
};

/** 実務案件を除いた個人開発作品だけを集計対象とする */
function isPersonal(project: RawProject): boolean {
  return project.kind !== "client";
}

/**
 * ISO 日付文字列（YYYY-MM-DD）の配列から最も古い/新しい日付を求める。
 * ISO 形式は文字列比較でそのまま日付順になるため localeCompare 等は不要。
 * 空配列なら null。
 */
export function computeMeasurementDateRange(
  dates: string[]
): { oldest: string; newest: string } | null {
  if (dates.length === 0) return null;

  let oldest = dates[0];
  let newest = dates[0];
  for (const date of dates) {
    if (date < oldest) oldest = date;
    if (date > newest) newest = date;
  }
  return { oldest, newest };
}

export function computePortfolioStats(projects: RawProject[]): PortfolioStats {
  const targets = projects.filter(isPersonal);

  let totalTests = 0;
  let totalVulnerabilities = 0;
  let totalSecretLeaks = 0;
  let liveProjects = 0;
  let performanceSum = 0;
  let lighthouseMeasuredCount = 0;
  let lighthouse90Count = 0;
  // StatsSummary に表示される集計（テスト総数・Lighthouse系）に実際に
  // 寄与した measuredAt だけを集める。footnote の計測日レンジ表示に使う。
  const contributingMeasuredDates: string[] = [];

  for (const project of targets) {
    if (project.liveUrl) liveProjects += 1;
    if (project.testCoverage) {
      totalTests += project.testCoverage.tests;
      contributingMeasuredDates.push(project.testCoverage.measuredAt);
    }
    if (project.secretScan) totalSecretLeaks += project.secretScan.leaks;

    const security = project.securityScores;
    if (security) {
      totalVulnerabilities +=
        security.critical + security.high + security.moderate + security.low;
    }

    const lighthouse = project.lighthouseScores;
    if (lighthouse) {
      lighthouseMeasuredCount += 1;
      performanceSum += lighthouse.performance;
      if (lighthouse.performance >= 90) lighthouse90Count += 1;
      contributingMeasuredDates.push(lighthouse.measuredAt);
    }
  }

  const measuredRange = computeMeasurementDateRange(contributingMeasuredDates);

  return {
    totalProjects: targets.length,
    liveProjects,
    totalTests,
    totalVulnerabilities,
    totalSecretLeaks,
    avgLighthousePerformance:
      lighthouseMeasuredCount === 0
        ? null
        : Math.round((performanceSum / lighthouseMeasuredCount) * 10) / 10,
    lighthouse90Count,
    lighthouseMeasuredCount,
    oldestMeasuredAt: measuredRange?.oldest ?? null,
    newestMeasuredAt: measuredRange?.newest ?? null,
  };
}
