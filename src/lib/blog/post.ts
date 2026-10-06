import { parseFrontmatter, type Frontmatter } from "./frontmatter";

/** One article in content/blog/<slug>.md, validated but not yet rendered. */
export type BlogPost = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD, when the article was last revised */
  updated?: string;
  summary: string;
  tags: string[];
  /** Project ids from src/lib/projects/data.ts */
  apps: string[];
  /** Repository / document URLs the article drew from */
  sources: string[];
  /** Markdown body without the frontmatter */
  body: string;
};

/** Entry of /blog/index.json for agents and the list page (no body). */
export type BlogIndexEntry = Pick<BlogPost, "slug" | "title" | "date" | "updated" | "summary" | "tags" | "apps">;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value);
}

function requireString(data: Frontmatter, key: string, slug: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`blog/${slug}: "${key}" must be a non-empty string`);
  }
  return value.trim();
}

function requireList(data: Frontmatter, key: string, slug: string): string[] {
  const value = data[key];
  if (!Array.isArray(value)) throw new Error(`blog/${slug}: "${key}" must be a list`);
  return value;
}

function requireDate(data: Frontmatter, key: string, slug: string): string {
  const value = requireString(data, key, slug);
  if (!isIsoDate(value)) throw new Error(`blog/${slug}: "${key}" must be YYYY-MM-DD, got ${value}`);
  return value;
}

/** Validates a Markdown file into a BlogPost. Throws with the slug and the offending field. */
export function parsePost(slug: string, source: string): BlogPost {
  if (!isValidSlug(slug)) throw new Error(`blog/${slug}: slug must be lowercase kebab-case`);
  const { data, body } = parseFrontmatter(source);

  const post: BlogPost = {
    slug,
    title: requireString(data, "title", slug),
    date: requireDate(data, "date", slug),
    summary: requireString(data, "summary", slug),
    tags: requireList(data, "tags", slug),
    apps: requireList(data, "apps", slug),
    sources: requireList(data, "sources", slug),
    body: body.trim(),
  };
  if (data.updated !== undefined) {
    const updated = requireDate(data, "updated", slug);
    if (updated < post.date) throw new Error(`blog/${slug}: "updated" is before "date"`);
    post.updated = updated;
  }
  if (post.body === "") throw new Error(`blog/${slug}: body is empty`);
  return post;
}

/** Newest first; ties broken by slug so the order is stable across builds. */
export function sortPosts<T extends { date: string; slug: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

export function toIndexEntry(post: BlogPost): BlogIndexEntry {
  const { slug, title, date, updated, summary, tags, apps } = post;
  return updated === undefined ? { slug, title, date, summary, tags, apps } : { slug, title, date, updated, summary, tags, apps };
}

/** Distinct tags across posts, most used first, then alphabetically. */
export function collectTags(posts: { tags: string[] }[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (a.count === b.count ? a.tag.localeCompare(b.tag) : b.count - a.count));
}

/** Posts carrying `tag`, or every post when tag is null. */
export function filterByTag<T extends { tags: string[] }>(posts: T[], tag: string | null): T[] {
  return tag === null ? posts : posts.filter((post) => post.tags.includes(tag));
}

/** "2026-10-06" → "2026年10月6日" for the Japanese UI. */
export function formatDateJa(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}
