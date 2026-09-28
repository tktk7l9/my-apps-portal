import type { RawProject } from "@/lib/projects";

/** Returns the featured picks in ascending featuredRank order */
export function selectFeatured<T extends RawProject>(projects: T[]): T[] {
  return projects
    .filter((p) => p.featuredRank !== undefined)
    .sort((a, b) => a.featuredRank! - b.featuredRank!);
}

/** Returns the works other than featured picks and client work, in their original order */
export function selectRest<T extends RawProject>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.featuredRank === undefined && p.kind !== "client"
  );
}
