import { describe, expect, it } from "vitest";
import { rawProjects } from "@/lib/projects";
import { featuredImageHints, selectFeatured, selectRest } from "@/lib/featured";
import { eyecatchSrc } from "@/lib/eyecatch";
import { makeProject } from "@/lib/test-fixtures";

describe("selectFeatured", () => {
  it("returns only projects with a featuredRank, in ascending order", () => {
    const result = selectFeatured([
      makeProject({ id: "c", featuredRank: 3 }),
      makeProject({ id: "plain" }),
      makeProject({ id: "a", featuredRank: 1 }),
      makeProject({ id: "b", featuredRank: 2 }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array when nothing is featured", () => {
    expect(selectFeatured([makeProject()])).toEqual([]);
  });
});

describe("selectRest", () => {
  it("returns the rest in the original order, excluding featured and client work", () => {
    const result = selectRest([
      makeProject({ id: "featured", featuredRank: 1 }),
      makeProject({ id: "client", kind: "client" }),
      makeProject({ id: "x" }),
      makeProject({ id: "y" }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["x", "y"]);
  });
});

describe("featured picks in the real data", () => {
  const featured = selectFeatured(rawProjects);

  it("has exactly 4 featured projects", () => {
    expect(featured).toHaveLength(4);
  });

  it("featuredRank is a unique sequence starting at 1", () => {
    // Check that ranks are consecutive rather than the length, so this test keeps working when the count changes
    expect(featured.map((p) => p.featuredRank)).toEqual(
      Array.from({ length: featured.length }, (_, i) => i + 1)
    );
  });

  it("every featured project has a highlight", () => {
    for (const project of featured) {
      expect(project.highlight, `${project.id} に highlight がない`).toBeTruthy();
    }
  });

  it("highlight fits the card within 80 characters", () => {
    for (const project of featured) {
      expect(
        project.highlight!.length,
        `${project.id} has a highlight that is too long`
      ).toBeLessThanOrEqual(80);
    }
  });

  it("only projects with a featuredRank have a highlight", () => {
    for (const project of rawProjects) {
      if (project.highlight !== undefined) {
        expect(
          project.featuredRank,
          `${project.id} has a highlight but no featuredRank`
        ).toBeDefined();
      }
    }
  });
});

describe("selectRest on the real data", () => {
  const rest = selectRest(rawProjects);

  it("has at least one client project (so this suite does not pass trivially)", () => {
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(clientCount).toBeGreaterThan(0);
  });

  it("excludes client work", () => {
    expect(rest.every((p) => p.kind !== "client")).toBe(true);
    expect(rest.map((p) => p.id)).not.toContain("client-realestate-admin");
  });

  it("excludes projects with a featuredRank", () => {
    expect(rest.every((p) => p.featuredRank === undefined)).toBe(true);
  });

  it("count equals total minus featured minus client work", () => {
    const featuredCount = selectFeatured(rawProjects).length;
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(rest.length).toBe(rawProjects.length - featuredCount - clientCount);
  });
});

describe("featuredImageHints", () => {
  it("preloads the first card at high priority because it is the LCP candidate", () => {
    expect(featuredImageHints(0)).toEqual({ loading: "eager", fetchPriority: "high", preload: true });
  });

  it("loads the second card eagerly without competing with the first", () => {
    expect(featuredImageHints(1)).toEqual({ loading: "eager", fetchPriority: "auto", preload: false });
  });

  it("lazy-loads the third card onwards", () => {
    expect(featuredImageHints(2)).toEqual({ loading: "lazy", fetchPriority: "auto", preload: false });
    expect(featuredImageHints(5)).toEqual({ loading: "lazy", fetchPriority: "auto", preload: false });
  });
});

describe("featured picks in the real data", () => {
  it("serve their eyecatch from the portal itself (a cross-origin image delays LCP by seconds)", () => {
    for (const project of selectFeatured(rawProjects)) {
      const src = eyecatchSrc(project);
      expect(src, `${project.id} eyecatch`).not.toBeNull();
      expect(src!.startsWith("/") && !src!.startsWith("//"), `${project.id}: ${src}`).toBe(true);
    }
  });
});
