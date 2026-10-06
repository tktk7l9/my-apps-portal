import { describe, expect, it } from "vitest";
import { loadPosts } from "@/lib/blog/load";
import { renderMarkdown, textLength } from "@/lib/blog/render";
import { rawProjects } from "@/lib/projects";

/**
 * Cross-checks every article in content/blog. Adding a file makes it part of this suite.
 * Mirrors service-anatomy's content.test.ts: the frontmatter schema, dates, app ids,
 * internal links and sources are enforced here rather than at request time.
 */

const posts = loadPosts();
const slugs = new Set(posts.map((p) => p.slug));
const projectIds = new Set(rawProjects.map((p) => p.id));

// Dates are written in the owner's local time (JST).
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

const MIN_CHARS = 1000;
const MAX_CHARS = 3500;

describe("blog content", () => {
  it("has at least one article", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  describe.each(posts.map((post) => [post.slug, post] as const))("%s", (_slug, post) => {
    it("has a publish date that is not in the future", () => {
      expect(post.date <= today, `date ${post.date} is after ${today}`).toBe(true);
      if (post.updated) expect(post.updated <= today).toBe(true);
    });

    it("references only existing app ids, without duplicates", () => {
      for (const id of post.apps) expect(projectIds.has(id), `unknown app id "${id}"`).toBe(true);
      expect(new Set(post.apps).size).toBe(post.apps.length);
    });

    it("has tags in kebab-case without duplicates", () => {
      expect(post.tags.length).toBeGreaterThan(0);
      for (const tag of post.tags) expect(tag, `tag "${tag}"`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(new Set(post.tags).size).toBe(post.tags.length);
    });

    it("lists https sources", () => {
      expect(post.sources.length).toBeGreaterThan(0);
      for (const url of post.sources) expect(url, `source "${url}"`).toMatch(/^https:\/\//);
    });

    it("has a summary short enough for a card and a meta description", () => {
      expect(post.summary.length).toBeGreaterThanOrEqual(30);
      expect(post.summary.length).toBeLessThanOrEqual(160);
    });

    it("renders to a readable article with sections and a 参考 list", async () => {
      const { html, headings } = await renderMarkdown(post.body);
      const length = textLength(html);
      expect(length, `body is ${length} characters`).toBeGreaterThanOrEqual(MIN_CHARS);
      expect(length, `body is ${length} characters`).toBeLessThanOrEqual(MAX_CHARS);

      const h2 = headings.filter((h) => h.level === 2);
      expect(h2.length, "needs at least two h2 sections").toBeGreaterThanOrEqual(2);
      expect(h2[h2.length - 1].text).toBe("参考");
      expect(new Set(headings.map((h) => h.id)).size).toBe(headings.length);
      expect(html).not.toContain("<script");
      // The page renders the title as the h1; the body must not add another.
      expect(post.body).not.toMatch(/^# /m);
    });

    it("links only to existing articles, portal works and absolute URLs", () => {
      const links = [...post.body.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
      for (const href of links) {
        if (href.startsWith("/blog/")) {
          const target = href.slice("/blog/".length).replace(/[#?].*$/, "");
          expect(slugs.has(target), `broken article link ${href}`).toBe(true);
        } else if (href.startsWith("/?work=")) {
          const id = href.slice("/?work=".length).replace(/[#&].*$/, "");
          expect(projectIds.has(id), `broken work link ${href}`).toBe(true);
        } else if (href.startsWith("#")) {
          // in-page anchors are checked by heading-id uniqueness above
        } else {
          expect(href, `unexpected link ${href}`).toMatch(/^https:\/\//);
        }
      }
    });
  });
});
