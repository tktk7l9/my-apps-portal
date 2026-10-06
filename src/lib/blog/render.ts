import type { Element, ElementContent, RootContent } from "hast";
import { toString as textContent } from "hast-util-to-string";
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
 * - The table of contents is read from the same sanitised tree, not from the HTML string.
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

export type Heading = { id: string; text: string; level: 2 | 3 };

export type RenderedMarkdown = { html: string; headings: Heading[] };

/** Renders an article and lists its h2/h3 (in document order) for the table of contents. */
export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const tree = await processor.run(processor.parse(markdown));
  return { html: processor.stringify(tree), headings: collectHeadings(tree.children, []) };
}

/**
 * The text comes from the heading's text nodes, so it is plain text: "<" stays "<" instead of
 * the "&#x3C;" the HTML serializer writes. The TOC renders it as a React text child, which React
 * escapes, so it can never become markup.
 */
function collectHeadings(nodes: RootContent[] | ElementContent[], headings: Heading[]): Heading[] {
  for (const node of nodes) {
    if (node.type !== "element") continue;
    const level = node.tagName === "h2" ? 2 : node.tagName === "h3" ? 3 : undefined;
    const id = node.properties.id;
    // An empty heading gets id="" (nothing to link to); the footnotes label is screen-reader only.
    if (level && typeof id === "string" && id !== "" && !isVisuallyHidden(node)) {
      headings.push({ level, id, text: textContent(node) });
    } else {
      collectHeadings(node.children, headings);
    }
  }
  return headings;
}

function isVisuallyHidden(node: Element): boolean {
  const className = node.properties.className;
  return Array.isArray(className) && className.includes("sr-only");
}

/** Visible-text length (excluding tags and collapsed whitespace), used by the content test. */
export function textLength(html: string): number {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .length;
}
