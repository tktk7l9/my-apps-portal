import { describe, expect, it } from "vitest";
import {
  collectTags,
  filterByTag,
  formatDateJa,
  isIsoDate,
  isValidSlug,
  parsePost,
  sortPosts,
  toIndexEntry,
} from "@/lib/blog/post";

const base = [
  "---",
  "title: Title",
  "date: 2026-10-06",
  "summary: Summary",
  "tags: [a, b]",
  "apps: [skydial]",
  "sources: [https://example.com]",
  "---",
  "",
  "Body text.",
].join("\n");

const withLine = (replace: string, by: string) => base.replace(replace, by);

describe("parsePost", () => {
  it("builds a post from valid frontmatter and trims the body", () => {
    const post = parsePost("my-post", base);
    expect(post).toEqual({
      slug: "my-post",
      title: "Title",
      date: "2026-10-06",
      summary: "Summary",
      tags: ["a", "b"],
      apps: ["skydial"],
      sources: ["https://example.com"],
      body: "Body text.",
    });
    expect(post.updated).toBeUndefined();
  });

  it("accepts an optional updated date on or after the publish date", () => {
    expect(parsePost("p", withLine("date: 2026-10-06", "date: 2026-10-06\nupdated: 2026-10-06")).updated).toBe("2026-10-06");
    expect(() => parsePost("p", withLine("date: 2026-10-06", "date: 2026-10-06\nupdated: 2026-10-05"))).toThrow(
      '"updated" is before "date"',
    );
  });

  it("rejects invalid slugs", () => {
    expect(() => parsePost("My_Post", base)).toThrow("kebab-case");
    expect(() => parsePost("-leading", base)).toThrow("kebab-case");
  });

  it("rejects missing or malformed required fields", () => {
    expect(() => parsePost("p", withLine("title: Title", "title: ''"))).toThrow('"title" must be a non-empty string');
    expect(() => parsePost("p", withLine("title: Title", "title: [x]"))).toThrow('"title" must be a non-empty string');
    expect(() => parsePost("p", withLine("date: 2026-10-06", "date: 2026-13-01"))).toThrow('"date" must be YYYY-MM-DD');
    expect(() => parsePost("p", withLine("date: 2026-10-06", "date: 10/06/2026"))).toThrow('"date" must be YYYY-MM-DD');
    expect(() => parsePost("p", withLine("tags: [a, b]", "tags: a"))).toThrow('"tags" must be a list');
    expect(() => parsePost("p", withLine("apps: [skydial]", "nope: 1"))).toThrow('"apps" must be a list');
  });

  it("rejects an empty body", () => {
    expect(() => parsePost("p", base.replace("Body text.", "   \n"))).toThrow("body is empty");
  });
});

describe("isValidSlug / isIsoDate", () => {
  it("accepts kebab-case slugs and real calendar dates only", () => {
    expect(isValidSlug("a1-b2")).toBe(true);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("a-")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
  });
});

describe("sortPosts", () => {
  it("orders newest first and breaks ties by slug, without mutating the input", () => {
    const input = [
      { slug: "b", date: "2026-01-01" },
      { slug: "z", date: "2026-03-01" },
      { slug: "a", date: "2026-01-01" },
    ];
    expect(sortPosts(input).map((p) => p.slug)).toEqual(["z", "a", "b"]);
    expect(input[0].slug).toBe("b");
  });
});

describe("toIndexEntry", () => {
  it("drops the body and sources, keeping updated only when present", () => {
    const post = parsePost("p", base);
    expect(toIndexEntry(post)).toEqual({
      slug: "p",
      title: "Title",
      date: "2026-10-06",
      summary: "Summary",
      tags: ["a", "b"],
      apps: ["skydial"],
    });
    expect(toIndexEntry({ ...post, updated: "2026-10-07" })).toMatchObject({ updated: "2026-10-07" });
  });
});

describe("collectTags / filterByTag", () => {
  const posts = [{ tags: ["x", "y"] }, { tags: ["y"] }, { tags: ["a"] }];

  it("counts tags, most used first then alphabetically", () => {
    expect(collectTags(posts)).toEqual([
      { tag: "y", count: 2 },
      { tag: "a", count: 1 },
      { tag: "x", count: 1 },
    ]);
  });

  it("filters by tag and returns everything for null", () => {
    expect(filterByTag(posts, "y")).toHaveLength(2);
    expect(filterByTag(posts, "missing")).toHaveLength(0);
    expect(filterByTag(posts, null)).toBe(posts);
  });
});

describe("formatDateJa", () => {
  it("writes the date in Japanese without zero padding", () => {
    expect(formatDateJa("2026-10-06")).toBe("2026年10月6日");
  });
});
