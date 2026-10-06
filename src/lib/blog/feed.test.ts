import { describe, expect, it } from "vitest";
import { buildRssFeed, escapeXml, toPubDate } from "@/lib/blog/feed";

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe("a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;");
  });
});

describe("toPubDate", () => {
  it("treats the article date as midnight JST", () => {
    expect(toPubDate("2026-10-06")).toBe("Mon, 05 Oct 2026 15:00:00 GMT");
  });
});

describe("buildRssFeed", () => {
  const args = {
    title: "Blog & more",
    description: "desc",
    siteUrl: "https://example.com",
    feedUrl: "https://example.com/blog/feed.xml",
    language: "ja",
    items: [
      {
        title: "A <b>",
        url: "https://example.com/blog/a",
        description: "first",
        date: "2026-10-06",
        categories: ["x", "y&z"],
      },
      { title: "B", url: "https://example.com/blog/b", description: "second", date: "2026-10-01", categories: [] },
    ],
  };

  it("builds a valid RSS 2.0 document with escaped content and categories", () => {
    const xml = buildRssFeed(args);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true);
    expect(xml).toContain("<title>Blog &amp; more</title>");
    expect(xml).toContain('<atom:link href="https://example.com/blog/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain("<title>A &lt;b&gt;</title>");
    expect(xml).toContain('<guid isPermaLink="true">https://example.com/blog/a</guid>');
    expect(xml).toContain("<category>y&amp;z</category>");
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml.endsWith("</rss>\n")).toBe(true);
  });

  it("omits the category element when an item has none", () => {
    const xml = buildRssFeed({ ...args, items: [args.items[1]] });
    expect(xml).not.toContain("<category>");
  });
});
