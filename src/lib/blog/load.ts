import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePost, sortPosts, type BlogPost } from "./post";

/**
 * Reads content/blog/*.md from disk. Only called at build time (generateStaticParams,
 * static pages, feed/json route handlers with force-static), never per request:
 * the Worker has no content/ directory to read.
 */

export const CONTENT_DIR = join(process.cwd(), "content", "blog");

export function listSlugs(dir: string = CONTENT_DIR): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -".md".length))
    .sort();
}

export function readPost(slug: string, dir: string = CONTENT_DIR): BlogPost {
  return parsePost(slug, readFileSync(join(dir, `${slug}.md`), "utf8"));
}

/** Every article, newest first. */
export function loadPosts(dir: string = CONTENT_DIR): BlogPost[] {
  return sortPosts(listSlugs(dir).map((slug) => readPost(slug, dir)));
}
