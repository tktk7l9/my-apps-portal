import { describe, expect, it } from "vitest";
import { rawProjects } from "@/lib/projects";
import { selectFeatured, selectRest } from "@/lib/featured";
import { makeProject } from "@/lib/test-fixtures";

describe("selectFeatured", () => {
  it("featuredRank を持つものだけを昇順で返す", () => {
    const result = selectFeatured([
      makeProject({ id: "c", featuredRank: 3 }),
      makeProject({ id: "plain" }),
      makeProject({ id: "a", featuredRank: 1 }),
      makeProject({ id: "b", featuredRank: 2 }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("代表作が無ければ空配列を返す", () => {
    expect(selectFeatured([makeProject()])).toEqual([]);
  });
});

describe("selectRest", () => {
  it("代表作と実務案件を除いたものを元の順序で返す", () => {
    const result = selectRest([
      makeProject({ id: "featured", featuredRank: 1 }),
      makeProject({ id: "client", kind: "client" }),
      makeProject({ id: "x" }),
      makeProject({ id: "y" }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["x", "y"]);
  });
});

describe("実データの代表作", () => {
  const featured = selectFeatured(rawProjects);

  it("代表作はちょうど 4 件である", () => {
    expect(featured).toHaveLength(4);
  });

  it("featuredRank は 1 から始まる連番で重複しない", () => {
    expect(featured.map((p) => p.featuredRank)).toEqual([1, 2, 3, 4]);
  });

  it("代表作にはすべて highlight が設定されている", () => {
    for (const project of featured) {
      expect(project.highlight, `${project.id} に highlight がない`).toBeTruthy();
    }
  });

  it("highlight は 80 文字以内でカードに収まる", () => {
    for (const project of featured) {
      expect(
        project.highlight!.length,
        `${project.id} の highlight が長すぎる`
      ).toBeLessThanOrEqual(80);
    }
  });
});

describe("実データの selectRest", () => {
  const rest = selectRest(rawProjects);

  it("実務案件が少なくとも1件存在する（このテストが自明にパスしないための前提）", () => {
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(clientCount).toBeGreaterThan(0);
  });

  it("実務案件は結果に含まれない", () => {
    expect(rest.every((p) => p.kind !== "client")).toBe(true);
    expect(rest.map((p) => p.id)).not.toContain("kousan-admin");
  });

  it("featuredRank を持つものは結果に含まれない", () => {
    expect(rest.every((p) => p.featuredRank === undefined)).toBe(true);
  });

  it("件数は 全体 - 代表作 - 実務案件 の数と一致する", () => {
    const featuredCount = selectFeatured(rawProjects).length;
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(rest.length).toBe(rawProjects.length - featuredCount - clientCount);
  });
});
