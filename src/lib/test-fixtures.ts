import type { RawProject } from "@/lib/projects";

/** テスト用の最小 RawProject。必要なフィールドだけ上書きして使う */
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
