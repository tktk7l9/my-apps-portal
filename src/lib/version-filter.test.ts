import { describe, expect, it } from "vitest";
import { filterVersionStatusesForProjects } from "@/lib/version-filter";

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
