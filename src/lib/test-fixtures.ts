import type { RawProject } from "@/lib/projects";

/** Minimal RawProject for tests. Override only the fields you need */
export function makeProject(overrides: Partial<RawProject> = {}): RawProject {
  return {
    id: "sample",
    name: "Sample",
    description: "説明",
    trackedPackages: [],
    category: "Tool",
    platform: "web",
    services: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
    githubUrl: "https://github.com/tktk7l9/sample",
    githubVisibility: "public",
    emoji: "🧪",
    ...overrides,
  };
}
