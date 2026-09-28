import type { Category, NativeCheck, NativeCheckStatus, Project } from "@/lib/projects";

export type SortKey = "name" | "category" | "createdAt" | "updatedAt";
export type SortDir = "asc" | "desc";

export type ListConditions = {
  category: Category;
  techs: string[];
  query: string;
};

/**
 * Normalises text for lenient search (SHIG 50): NFKC folds full-width letters
 * ("ＮｅｘｔＪＳ") and half-width kana, lower-casing folds case, and katakana is
 * mapped to hiragana so "げーむ" finds "ゲーム".
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

export function hasActiveConditions({ category, techs, query }: ListConditions): boolean {
  return category !== "All" || techs.length > 0 || query.trim() !== "";
}

export function filterProjects<T extends Project>(projects: T[], conditions: ListConditions): T[] {
  const q = normalizeForSearch(conditions.query);
  return projects.filter((p) => {
    const matchCat = conditions.category === "All" || p.category === conditions.category;
    const matchTech =
      conditions.techs.length === 0 || p.techVersions.some((t) => conditions.techs.includes(t.name));
    const haystack = [p.name, p.description, ...p.techVersions.map((t) => t.name), ...p.services];
    const matchQ = !q || haystack.some((text) => normalizeForSearch(text).includes(q));
    return matchCat && matchTech && matchQ;
  });
}

export function sortProjects<T extends Project>(
  projects: T[],
  key: SortKey,
  dir: SortDir,
  lastCommitDates: Record<string, string>
): T[] {
  const valueOf = (p: T): string => {
    if (key === "updatedAt") return lastCommitDates[p.id] ?? p.updatedAt;
    if (key === "name") return p.name.toLowerCase();
    return p[key];
  };
  return [...projects].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

/** Words for native check statuses, used instead of ✓ / ⚠ / ✕ glyphs (SHIG 70, 96) */
export const nativeCheckLabel: Record<NativeCheckStatus, string> = {
  pass: "合格",
  warn: "注意",
  fail: "不合格",
};

/** "合格 4・注意 1" — zero counts other than pass are omitted */
export function nativeSummary(checks: NativeCheck[]): string {
  const count = (status: NativeCheckStatus) => checks.filter((c) => c.status === status).length;
  const parts = [`${nativeCheckLabel.pass} ${count("pass")}`];
  for (const status of ["warn", "fail"] as const) {
    const n = count(status);
    if (n > 0) parts.push(`${nativeCheckLabel[status]} ${n}`);
  }
  return parts.join("・");
}

/** Headline metrics for a compact card (the full breakdown lives in the detail modal) */
export function summaryMetrics(project: Project): string[] {
  const metrics: string[] = [];
  if (project.lighthouseScores) {
    metrics.push(`Lighthouse ${project.lighthouseScores.performance}`);
  } else if (project.nativeQuality) {
    metrics.push(`品質チェック ${nativeSummary(project.nativeQuality.checks)}`);
  }
  if (project.testCoverage) {
    metrics.push(`${project.testCoverage.tests} テスト`);
  }
  if (project.securityHeaders?.grade) {
    metrics.push(`Observatory ${project.securityHeaders.grade}`);
  }
  return metrics;
}
