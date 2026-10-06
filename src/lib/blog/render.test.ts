import { describe, expect, it } from "vitest";
import { renderMarkdown, textLength } from "@/lib/blog/render";

describe("renderMarkdown", () => {
  it("renders GFM tables, code fences with language classes and slugged headings", async () => {
    const { html } = await renderMarkdown(
      ["## 見出し", "", "| a | b |", "|---|---|", "| 1 | 2 |", "", "```ts", "const x = 1;", "```", "", "### Sub"].join("\n"),
    );
    expect(html).toContain('<h2 id="見出し">見出し</h2>');
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain('<h3 id="sub">Sub</h3>');
  });

  it("drops raw HTML, scripts, inline handlers and javascript: links", async () => {
    const { html } = await renderMarkdown(
      ['<script>alert(1)</script>', "", '<img src=x onerror="alert(1)">', "", "[x](javascript:alert(1))", "", "[ok](https://example.com)"].join("\n"),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('<a href="https://example.com">ok</a>');
  });

  it("does not prefix heading ids", async () => {
    const { html } = await renderMarkdown("## Topic");
    expect(html).toContain('id="topic"');
    expect(html).not.toContain("user-content");
  });
});

describe("renderMarkdown headings (table of contents)", () => {
  it("lists h2 and h3 in document order with inline markup flattened to text", async () => {
    const { headings } = await renderMarkdown(["## A `x`", "", "t", "", "### B", "", "#### C"].join("\n"));
    expect(headings).toEqual([
      { level: 2, id: "a-x", text: "A x" },
      { level: 3, id: "b", text: "B" },
    ]);
  });

  // Regression: the text used to be cut out of the serialized HTML, so "<" showed up as "&#x3C;".
  it("keeps <, &, quotes and inline code as plain text while the article HTML stays escaped", async () => {
    const { html, headings } = await renderMarkdown(
      ["## `<meta>` タグと & の扱い", "", "### \"quoted\" と 'single' と a < b", "", "## 参考"].join("\n"),
    );
    expect(headings).toEqual([
      { level: 2, id: "meta-タグと--の扱い", text: "<meta> タグと & の扱い" },
      { level: 3, id: "quoted-と-single-と-a--b", text: "\"quoted\" と 'single' と a < b" },
      { level: 2, id: "参考", text: "参考" },
    ]);
    expect(html).toContain("<code>&#x3C;meta></code> タグと &#x26; の扱い");
  });

  it("skips empty headings and the screen-reader-only footnotes label, and finds headings in quotes", async () => {
    const { html, headings } = await renderMarkdown(["##", "", "> ## Quoted", "", "Text[^1]", "", "[^1]: Note"].join("\n"));
    expect(html).toContain('<h2 class="sr-only" id="footnote-label">');
    expect(headings).toEqual([{ level: 2, id: "quoted", text: "Quoted" }]);
  });
});

describe("textLength", () => {
  it("counts visible characters only", () => {
    expect(textLength("<p>あい う</p>\n<pre><code>x y</code></pre>")).toBe(5);
  });
});
