import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/projects";
import { makeProject } from "@/lib/test-fixtures";
import {
  filterProjects,
  hasActiveConditions,
  nativeCheckLabel,
  nativeSummary,
  normalizeForSearch,
  sortProjects,
  summaryMetrics,
} from "@/lib/project-list";

function project(overrides: Partial<Project> = {}): Project {
  return { techVersions: [], ...makeProject(overrides), ...overrides } as Project;
}

describe("normalizeForSearch", () => {
  it("folds full-width characters, case and katakana", () => {
    expect(normalizeForSearch("ＮｅｘｔＪＳ")).toBe("nextjs");
    expect(normalizeForSearch("ゲーム")).toBe(normalizeForSearch("げーむ"));
    expect(normalizeForSearch("  TS  ")).toBe("ts");
  });
});

describe("filterProjects", () => {
  const items = [
    project({ id: "a", name: "Skydial", category: "Tool", techVersions: [{ name: "Next.js", docsUrl: "", version: "16" }] }),
    project({ id: "b", name: "Tetris", category: "Game", description: "ブロックのゲーム", services: ["Cloudflare"] }),
  ];

  it("returns everything with no conditions", () => {
    expect(filterProjects(items, { category: "All", techs: [], query: "" })).toHaveLength(2);
  });

  it("filters by category and tech", () => {
    expect(filterProjects(items, { category: "Game", techs: [], query: "" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProjects(items, { category: "All", techs: ["Next.js"], query: "" }).map((p) => p.id)).toEqual(["a"]);
  });

  it("matches full-width and kana-variant queries against name, description, tech and services", () => {
    expect(filterProjects(items, { category: "All", techs: [], query: "ＮＥＸＴ" }).map((p) => p.id)).toEqual(["a"]);
    expect(filterProjects(items, { category: "All", techs: [], query: "げーむ" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProjects(items, { category: "All", techs: [], query: "cloudflare" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProjects(items, { category: "All", techs: [], query: "sky" }).map((p) => p.id)).toEqual(["a"]);
    expect(filterProjects(items, { category: "All", techs: [], query: "zzz" })).toEqual([]);
  });
});

describe("hasActiveConditions", () => {
  it("is true when any condition is set", () => {
    expect(hasActiveConditions({ category: "All", techs: [], query: " " })).toBe(false);
    expect(hasActiveConditions({ category: "Game", techs: [], query: "" })).toBe(true);
    expect(hasActiveConditions({ category: "All", techs: ["React"], query: "" })).toBe(true);
    expect(hasActiveConditions({ category: "All", techs: [], query: "x" })).toBe(true);
  });
});

describe("sortProjects", () => {
  const items = [
    project({ id: "a", name: "beta", category: "Tool", createdAt: "2026-01-01", updatedAt: "2026-03-01" }),
    project({ id: "b", name: "Alpha", category: "Game", createdAt: "2026-02-01", updatedAt: "2026-02-01" }),
  ];

  it("sorts by name case-insensitively", () => {
    expect(sortProjects(items, "name", "asc", {}).map((p) => p.id)).toEqual(["b", "a"]);
    expect(sortProjects(items, "name", "desc", {}).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("sorts by createdAt and category", () => {
    expect(sortProjects(items, "createdAt", "desc", {}).map((p) => p.id)).toEqual(["b", "a"]);
    expect(sortProjects(items, "category", "asc", {}).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("sorts by updatedAt, preferring the fetched commit date", () => {
    expect(sortProjects(items, "updatedAt", "desc", {}).map((p) => p.id)).toEqual(["a", "b"]);
    expect(sortProjects(items, "updatedAt", "desc", { b: "2026-09-01" }).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    sortProjects(items, "name", "asc", {});
    expect(items).toEqual(copy);
  });
});

describe("summaryMetrics", () => {
  it("lists the headline metrics that exist", () => {
    expect(
      summaryMetrics(
        project({
          lighthouseScores: { performance: 96, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-09-01" },
          testCoverage: { statements: 100, branches: 100, functions: 100, lines: 100, tests: 206, measuredAt: "2026-09-01" },
          securityHeaders: { grade: "A+", score: 120, measuredAt: "2026-09-01" },
        })
      )
    ).toEqual(["Lighthouse 96", "206 テスト", "Observatory A+"]);
  });

  it("uses the native check summary when there is no Lighthouse score", () => {
    expect(
      summaryMetrics(
        project({
          nativeQuality: { checks: [{ label: "x", status: "pass" }], measuredAt: "2026-09-01" },
          securityHeaders: { grade: null, score: null, measuredAt: "2026-09-01" },
        })
      )
    ).toEqual(["品質チェック 合格 1"]);
  });

  it("returns an empty list when nothing was measured", () => {
    expect(summaryMetrics(project())).toEqual([]);
  });
});

describe("nativeSummary / nativeCheckLabel", () => {
  it("summarises checks in words instead of symbols", () => {
    expect(
      nativeSummary([
        { label: "a", status: "pass" },
        { label: "b", status: "pass" },
        { label: "c", status: "warn" },
        { label: "d", status: "fail" },
      ])
    ).toBe("合格 2・注意 1・不合格 1");
    expect(nativeSummary([{ label: "a", status: "pass" }])).toBe("合格 1");
    expect(nativeSummary([])).toBe("合格 0");
  });

  it("labels each status", () => {
    expect(nativeCheckLabel.pass).toBe("合格");
    expect(nativeCheckLabel.warn).toBe("注意");
    expect(nativeCheckLabel.fail).toBe("不合格");
  });
});
