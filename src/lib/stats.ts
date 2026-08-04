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
};

/** 実務案件を除いた個人開発作品だけを集計対象とする */
function isPersonal(project: RawProject): boolean {
  return project.kind !== "client";
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

  for (const project of targets) {
    if (project.liveUrl) liveProjects += 1;
    if (project.testCoverage) totalTests += project.testCoverage.tests;
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
    }
  }

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
  };
}
