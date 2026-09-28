import type { RawProject } from "@/lib/projects";

export type PortfolioStats = {
  /** Total number of personal projects (excluding kind: "client") */
  totalProjects: number;
  /** Number of works with a liveUrl */
  liveProjects: number;
  /** Sum of testCoverage.tests */
  totalTests: number;
  /** Sum of npm audit critical + high + moderate + low */
  totalVulnerabilities: number;
  /** Sum of gitleaks findings */
  totalSecretLeaks: number;
  /** Average Lighthouse Performance (1 decimal place). null when there are none */
  avgLighthousePerformance: number | null;
  /** Number with Performance 90 or higher */
  lighthouse90Count: number;
  /** Number with lighthouseScores */
  lighthouseMeasuredCount: number;
  /** Oldest measuredAt (YYYY-MM-DD) among the measurements that contributed to the stats. null when there are none */
  oldestMeasuredAt: string | null;
  /** Newest measuredAt (YYYY-MM-DD) among the measurements that contributed to the stats. null when there are none */
  newestMeasuredAt: string | null;
};

/** Only personal projects, excluding client work, are counted */
function isPersonal(project: RawProject): boolean {
  return project.kind !== "client";
}

/**
 * Finds the oldest/newest date in an array of ISO date strings (YYYY-MM-DD).
 * ISO format sorts chronologically by plain string comparison, so localeCompare etc. is unnecessary.
 * null for an empty array.
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
  // Collect only the measuredAt values that actually contributed to the stats shown in
  // StatsSummary (total tests, Lighthouse). Used for the measurement date range in the footnote.
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
