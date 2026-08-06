import { describe, expect, it } from "vitest";
import {
  collectVersionCheckEntries,
  filterVersionStatusesForProjects,
} from "@/lib/version-filter";

describe("filterVersionStatusesForProjects", () => {
  it("渡した projects の techVersions に含まれるキーだけを残す", () => {
    const versionStatuses = {
      "Next.js@16.2.12": "latest" as const,
      "React@19.0.0": "outdated" as const,
      "Svelte@5.0.0": "vulnerable" as const,
    };
    const projects = [
      {
        techVersions: [
          { name: "Next.js", docsUrl: "https://nextjs.org", version: "16.2.12" },
        ],
      },
    ];

    const result = filterVersionStatusesForProjects(versionStatuses, projects);

    expect(result).toEqual({ "Next.js@16.2.12": "latest" });
  });

  it("複数プロジェクト分のキーを和集合で残す", () => {
    const versionStatuses = {
      "Next.js@16.2.12": "latest" as const,
      "React@19.0.0": "outdated" as const,
      "Svelte@5.0.0": "vulnerable" as const,
    };
    const projects = [
      {
        techVersions: [
          { name: "Next.js", docsUrl: "https://nextjs.org", version: "16.2.12" },
        ],
      },
      {
        techVersions: [
          { name: "React", docsUrl: "https://react.dev", version: "19.0.0" },
        ],
      },
    ];

    const result = filterVersionStatusesForProjects(versionStatuses, projects);

    expect(result).toEqual({
      "Next.js@16.2.12": "latest",
      "React@19.0.0": "outdated",
    });
  });

  it("projects が空なら空オブジェクトを返す", () => {
    const versionStatuses = { "Next.js@16.2.12": "latest" as const };
    expect(filterVersionStatusesForProjects(versionStatuses, [])).toEqual({});
  });

  it("versionStatuses が空なら空オブジェクトを返す", () => {
    const projects = [
      {
        techVersions: [
          { name: "Next.js", docsUrl: "https://nextjs.org", version: "16.2.12" },
        ],
      },
    ];
    expect(filterVersionStatusesForProjects({}, projects)).toEqual({});
  });

  it("projects の techVersions に無いキーは除外する", () => {
    const versionStatuses = {
      "Next.js@16.2.12": "latest" as const,
      "React@19.0.0": "outdated" as const,
    };
    const projects = [
      {
        techVersions: [
          { name: "Next.js", docsUrl: "https://nextjs.org", version: "15.0.0" },
        ],
      },
    ];

    // バージョンが一致しないので "Next.js@16.2.12" は残らない
    expect(filterVersionStatusesForProjects(versionStatuses, projects)).toEqual({});
  });
});

describe("collectVersionCheckEntries", () => {
  const nextTech = {
    name: "Next.js",
    docsUrl: "https://nextjs.org",
    version: "16.3.0",
  };

  it("techVersions を照会単位へ平坦化する", () => {
    const projects = [
      { techVersions: [nextTech] },
      {
        techVersions: [
          { name: "React", docsUrl: "https://react.dev", version: "19.2.8" },
        ],
      },
    ];

    expect(collectVersionCheckEntries(projects)).toEqual([
      { techName: "Next.js", version: "16.3.0", versionIsRange: undefined },
      { techName: "React", version: "19.2.8", versionIsRange: undefined },
    ]);
  });

  it("staticTech を宣言したプロジェクトは丸ごと除外する", () => {
    // agent-cockpit は React "19" / TypeScript "6.0" とメジャーのみ宣言しており、
    // npm registry と比較すると常に outdated になってしまう
    const projects = [
      { techVersions: [nextTech] },
      {
        staticTech: [
          { name: "React", docsUrl: "https://react.dev", version: "19" },
        ],
        techVersions: [
          { name: "React", docsUrl: "https://react.dev", version: "19" },
          { name: "TypeScript", docsUrl: "https://ts.dev", version: "6.0" },
        ],
      },
    ];

    expect(collectVersionCheckEntries(projects)).toEqual([
      { techName: "Next.js", version: "16.3.0", versionIsRange: undefined },
    ]);
  });

  it("versionIsRange をそのまま引き継ぐ", () => {
    const projects = [
      {
        techVersions: [
          { ...nextTech, version: "16.2.10", versionIsRange: true },
          { name: "React", docsUrl: "https://react.dev", version: "19.2.8", versionIsRange: false },
        ],
      },
    ];

    expect(collectVersionCheckEntries(projects)).toEqual([
      { techName: "Next.js", version: "16.2.10", versionIsRange: true },
      { techName: "React", version: "19.2.8", versionIsRange: false },
    ]);
  });

  it("空配列なら空配列を返す", () => {
    expect(collectVersionCheckEntries([])).toEqual([]);
  });
});
