import type { RawProject } from "@/lib/projects";

/** 代表作を featuredRank の昇順で返す */
export function selectFeatured<T extends RawProject>(projects: T[]): T[] {
  return projects
    .filter((p) => p.featuredRank !== undefined)
    .sort((a, b) => a.featuredRank! - b.featuredRank!);
}

/** 代表作と実務案件を除いた作品を、元の順序のまま返す */
export function selectRest<T extends RawProject>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.featuredRank === undefined && p.kind !== "client"
  );
}
