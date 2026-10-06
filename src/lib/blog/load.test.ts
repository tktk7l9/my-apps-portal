import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CONTENT_DIR, listSlugs, loadPosts, readPost } from "@/lib/blog/load";

const article = (title: string, date: string) =>
  ["---", `title: ${title}`, `date: ${date}`, "summary: s", "tags: []", "apps: []", "sources: []", "---", "", "text"].join("\n");

describe("blog loader", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "blog-load-"));
    writeFileSync(join(dir, "older.md"), article("Older", "2026-01-01"));
    writeFileSync(join(dir, "newer.md"), article("Newer", "2026-02-01"));
    writeFileSync(join(dir, "notes.txt"), "ignored");
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("lists only .md files as slugs, sorted", () => {
    expect(listSlugs(dir)).toEqual(["newer", "older"]);
  });

  it("reads one post by slug", () => {
    expect(readPost("older", dir).title).toBe("Older");
  });

  it("loads every post newest first", () => {
    expect(loadPosts(dir).map((p) => p.slug)).toEqual(["newer", "older"]);
  });

  it("defaults to the repository content directory", () => {
    expect(CONTENT_DIR.endsWith(join("content", "blog"))).toBe(true);
    expect(loadPosts().length).toBeGreaterThan(0);
  });
});
