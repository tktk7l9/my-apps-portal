import { describe, expect, it } from "vitest";
import { computeMeasurementDateRange, computePortfolioStats } from "@/lib/stats";
import { makeProject } from "@/lib/test-fixtures";
import { rawProjects } from "@/lib/projects";

describe("computePortfolioStats", () => {
  it("returns all zeros and null average and measured date range for an empty array", () => {
    expect(computePortfolioStats([])).toEqual({
      totalProjects: 0,
      liveProjects: 0,
      totalTests: 0,
      totalVulnerabilities: 0,
      totalSecretLeaks: 0,
      avgLighthousePerformance: null,
      lighthouse90Count: 0,
      lighthouseMeasuredCount: 0,
      oldestMeasuredAt: null,
      newestMeasuredAt: null,
    });
  });

  it("excludes kind: client projects from the totals", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a" }),
      makeProject({ id: "b", kind: "client" }),
      makeProject({ id: "c", kind: "personal" }),
    ]);
    expect(stats.totalProjects).toBe(2);
  });

  it("counts only projects with a liveUrl as liveProjects", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a", liveUrl: "https://example.com" }),
      makeProject({ id: "b" }),
    ]);
    expect(stats.liveProjects).toBe(1);
  });

  it("sums tests, vulnerabilities and secret findings", () => {
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
        securityScores: {
          score: 95, critical: 0, high: 0, moderate: 1, low: 2,
          totalDependencies: 5, tool: "npm", measuredAt: "2026-01-01",
        },
        secretScan: { leaks: 2, commits: 4, measuredAt: "2026-01-01" },
      }),
    ]);
    expect(stats.totalTests).toBe(246);
    expect(stats.totalVulnerabilities).toBe(13);
    expect(stats.totalSecretLeaks).toBe(7);
  });

  it("rounds the Lighthouse Performance average to one decimal and counts scores of 90 or more", () => {
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

  it("rounds a non-terminating average to one decimal", () => {
    const lh = (performance: number) => ({
      performance, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-01-01",
    });
    const stats = computePortfolioStats([
      makeProject({ id: "a", lighthouseScores: lh(100) }),
      makeProject({ id: "b", lighthouseScores: lh(99) }),
      makeProject({ id: "c", lighthouseScores: lh(90) }),
    ]);
    // (100 + 99 + 90) / 3 = 96.333... -> rounds to 96.3
    expect(stats.avgLighthousePerformance).toBe(96.3);
  });

  it("excludes client work from the Lighthouse totals too", () => {
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

  it("finds the oldest and newest measuredAt across testCoverage / lighthouseScores", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "a",
        testCoverage: {
          statements: 100, branches: 100, functions: 100, lines: 100,
          tests: 10, measuredAt: "2026-05-19",
        },
      }),
      makeProject({
        id: "b",
        lighthouseScores: {
          performance: 100, accessibility: 100, bestPractices: 100, seo: 100,
          measuredAt: "2026-08-05",
        },
      }),
    ]);
    expect(stats.oldestMeasuredAt).toBe("2026-05-19");
    expect(stats.newestMeasuredAt).toBe("2026-08-05");
  });

  it("excludes client work measuredAt from the measured date range", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "client",
        kind: "client",
        testCoverage: {
          statements: 100, branches: 100, functions: 100, lines: 100,
          tests: 10, measuredAt: "2020-01-01",
        },
      }),
      makeProject({
        id: "a",
        testCoverage: {
          statements: 100, branches: 100, functions: 100, lines: 100,
          tests: 10, measuredAt: "2026-06-01",
        },
      }),
    ]);
    expect(stats.oldestMeasuredAt).toBe("2026-06-01");
    expect(stats.newestMeasuredAt).toBe("2026-06-01");
  });

  it("returns a null measured date range without testCoverage or lighthouseScores", () => {
    const stats = computePortfolioStats([makeProject({ id: "a" })]);
    expect(stats.oldestMeasuredAt).toBeNull();
    expect(stats.newestMeasuredAt).toBeNull();
  });
});

describe("computeMeasurementDateRange", () => {
  it("returns null for an empty array", () => {
    expect(computeMeasurementDateRange([])).toBeNull();
  });

  it("returns the same oldest and newest for a single element", () => {
    expect(computeMeasurementDateRange(["2026-05-19"])).toEqual({
      oldest: "2026-05-19",
      newest: "2026-05-19",
    });
  });

  it("finds the oldest and newest of several ISO dates regardless of order", () => {
    expect(
      computeMeasurementDateRange(["2026-07-16", "2026-05-19", "2026-08-05", "2026-06-23"])
    ).toEqual({ oldest: "2026-05-19", newest: "2026-08-05" });
  });
});

describe("totals on the real data", () => {
  it("excludes client work from the totals", () => {
    const stats = computePortfolioStats(rawProjects);
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(clientCount).toBeGreaterThan(0);
    expect(stats.totalProjects).toBe(rawProjects.length - clientCount);
  });

  it("client work has no external links", () => {
    for (const project of rawProjects.filter((p) => p.kind === "client")) {
      expect(project.liveUrl, `${project.id} に liveUrl がある`).toBeUndefined();
      expect(project.githubVisibility).toBe("private");
    }
  });

  it("client work is not tracked for npm versions", () => {
    for (const project of rawProjects.filter((p) => p.kind === "client")) {
      expect(project.staticTech, `${project.id} に staticTech がない`).toBeTruthy();
      expect(project.trackedPackages).toEqual([]);
    }
  });
});
