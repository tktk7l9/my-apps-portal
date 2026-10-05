import { describe, expect, it } from "vitest";
import {
  collectVersionCheckEntries,
  filterVersionStatusesForProjects,
} from "@/lib/version-filter";

describe("filterVersionStatusesForProjects", () => {
  it("keeps only keys found in the given projects' techVersions", () => {
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

  it("keeps the union of keys across projects", () => {
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

  it("returns an empty object when projects is empty", () => {
    const versionStatuses = { "Next.js@16.2.12": "latest" as const };
    expect(filterVersionStatusesForProjects(versionStatuses, [])).toEqual({});
  });

  it("returns an empty object when versionStatuses is empty", () => {
    const projects = [
      {
        techVersions: [
          { name: "Next.js", docsUrl: "https://nextjs.org", version: "16.2.12" },
        ],
      },
    ];
    expect(filterVersionStatusesForProjects({}, projects)).toEqual({});
  });

  it("drops keys not in the projects' techVersions", () => {
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

    // The version does not match, so "Next.js@16.2.12" is not kept
    expect(filterVersionStatusesForProjects(versionStatuses, projects)).toEqual({});
  });
});

describe("collectVersionCheckEntries", () => {
  const nextTech = {
    name: "Next.js",
    docsUrl: "https://nextjs.org",
    version: "16.3.0",
  };

  it("flattens techVersions into lookup entries", () => {
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

  it("skips projects that declare staticTech entirely", () => {
    // agent-cockpit declares only majors, React "19" / TypeScript "6.0",
    // so comparing against the npm registry would always report outdated
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

  it("carries versionIsRange over as is", () => {
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

  it("returns an empty array for an empty array", () => {
    expect(collectVersionCheckEntries([])).toEqual([]);
  });
});
