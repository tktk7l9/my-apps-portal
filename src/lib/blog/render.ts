import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Markdown → sanitised HTML for blog articles. Runs at build time only (pages are fully
 * static), so the client receives plain HTML and the CSP stays as it is.
 *
 * - Raw HTML in Markdown is dropped by remark-rehype (allowDangerousHtml stays off).
 * - rehype-sanitize's default (GitHub) schema is applied on top, so even a future
 *   plugin cannot emit <script>, inline handlers or javascript: URLs.
 * - Heading ids come from rehype-slug (for the table of contents / deep links).
 */

const schema: SanitizeSchema = {
  ...defaultSchema,
  // The default (GitHub) schema already allows `id` on every element and `language-*`
  // classes on <code>. It prefixes ids with "user-content-"; slugs are short and safe.
  clobberPrefix: "",
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Extracts h2/h3 headings from rendered HTML for the table of contents. */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const pattern = /<h([23]) id="([^"]+)">(.*?)<\/h\1>/g;
  for (const match of html.matchAll(pattern)) {
    headings.push({
      level: match[1] === "2" ? 2 : 3,
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ""),
    });
  }
  return headings;
}

/** Visible-text length (excluding tags and collapsed whitespace), used by the content test. */
export function textLength(html: string): number {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .length;
}
