/**
 * RSS 2.0 feed for /blog/feed.xml, generated at build time from the article list.
 * Pure string building so it is testable without a request.
 */

export type FeedItem = {
  title: string;
  url: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  categories: string[];
};

export type FeedArgs = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  language: string;
  items: FeedItem[];
};

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/** "YYYY-MM-DD" → RFC 1123 pubDate. Articles are dated in JST, so midnight JST is used. */
export function toPubDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00+09:00`).toUTCString();
}

export function buildRssFeed(args: FeedArgs): string {
  const items = args.items.map((item) =>
    [
      "    <item>",
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
      `      <pubDate>${toPubDate(item.date)}</pubDate>`,
      `      <description>${escapeXml(item.description)}</description>`,
      ...item.categories.map((category) => `      <category>${escapeXml(category)}</category>`),
      "    </item>",
    ].join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    "  <channel>",
    `    <title>${escapeXml(args.title)}</title>`,
    `    <link>${escapeXml(args.siteUrl)}</link>`,
    `    <description>${escapeXml(args.description)}</description>`,
    `    <language>${escapeXml(args.language)}</language>`,
    `    <atom:link href="${escapeXml(args.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
