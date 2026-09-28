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

export type FeaturedImageHints = {
  loading: "eager" | "lazy";
  fetchPriority: "high" | "auto";
  /** Emit a <link rel="preload"> so the image starts before the card markup is parsed */
  preload: boolean;
};

/** Loading hints for the eyecatch of the featured card at `index`.
 *
 *  The first card is the LCP element on mobile (one column), so it is preloaded at high
 *  priority. The second is still above the fold on desktop (two columns) and loads eagerly
 *  at normal priority so it does not compete with the first. The rest are lazy.
 */
export function featuredImageHints(index: number): FeaturedImageHints {
  if (index === 0) return { loading: "eager", fetchPriority: "high", preload: true };
  if (index === 1) return { loading: "eager", fetchPriority: "auto", preload: false };
  return { loading: "lazy", fetchPriority: "auto", preload: false };
}
