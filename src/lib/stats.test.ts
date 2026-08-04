import { describe, expect, it } from "vitest";
import { computePortfolioStats } from "@/lib/stats";
import { makeProject } from "@/lib/test-fixtures";

describe("computePortfolioStats", () => {
  it("空配列ならすべて 0 で、平均は null になる", () => {
    expect(computePortfolioStats([])).toEqual({
      totalProjects: 0,
      liveProjects: 0,
      totalTests: 0,
      totalVulnerabilities: 0,
      totalSecretLeaks: 0,
      avgLighthousePerformance: null,
      lighthouse90Count: 0,
      lighthouseMeasuredCount: 0,
    });
  });

  it("kind: client の実務案件を集計から除外する", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a" }),
      makeProject({ id: "b", kind: "client" }),
      makeProject({ id: "c", kind: "personal" }),
    ]);
    expect(stats.totalProjects).toBe(2);
  });

  it("liveUrl を持つ作品だけを liveProjects に数える", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a", liveUrl: "https://example.com" }),
      makeProject({ id: "b" }),
    ]);
    expect(stats.liveProjects).toBe(1);
  });

  it("テスト数・脆弱性・シークレット検出を合計する", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "a",
        testCoverage: {
          statements: 100, branches: 100, functions: 100, lines: 100,
          tests: 200, measuredAt: "2026-01-01",
        },
        securityScores: {
          score: 90, critical: 1, high: 2, moderate: 3, low: 4,
          totalDependencies: 10, tool: "npm", measuredAt: "2026-01-01",
        },
        secretScan: { leaks: 5, commits: 10, measuredAt: "2026-01-01" },
      }),
      makeProject({
        id: "b",
        testCoverage: {
          statements: 80, branches: 80, functions: 80, lines: 80,
          tests: 46, measuredAt: "2026-01-01",
        },
      }),
    ]);
    expect(stats.totalTests).toBe(246);
    expect(stats.totalVulnerabilities).toBe(10);
    expect(stats.totalSecretLeaks).toBe(5);
  });

  it("Lighthouse Performance の平均を小数第1位で丸め、90 以上の件数を数える", () => {
    const lh = (performance: number) => ({
      performance, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-01-01",
    });
    const stats = computePortfolioStats([
      makeProject({ id: "a", lighthouseScores: lh(100) }),
      makeProject({ id: "b", lighthouseScores: lh(99) }),
      makeProject({ id: "c", lighthouseScores: lh(89) }),
      makeProject({ id: "d" }),
    ]);
    expect(stats.avgLighthousePerformance).toBe(96);
    expect(stats.lighthouse90Count).toBe(2);
    expect(stats.lighthouseMeasuredCount).toBe(3);
  });

  it("平均が割り切れない場合は小数第1位に丸める", () => {
    const lh = (performance: number) => ({
      performance, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-01-01",
    });
    const stats = computePortfolioStats([
      makeProject({ id: "a", lighthouseScores: lh(100) }),
      makeProject({ id: "b", lighthouseScores: lh(99) }),
      makeProject({ id: "c", lighthouseScores: lh(98) }),
    ]);
    expect(stats.avgLighthousePerformance).toBe(99);
  });

  it("実務案件は Lighthouse 集計にも含めない", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "client",
        kind: "client",
        lighthouseScores: {
          performance: 10, accessibility: 10, bestPractices: 10, seo: 10,
          measuredAt: "2026-01-01",
        },
      }),
    ]);
    expect(stats.avgLighthousePerformance).toBeNull();
    expect(stats.lighthouseMeasuredCount).toBe(0);
  });
});
