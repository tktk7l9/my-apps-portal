import { describe, expect, it } from "vitest";
import { extractHeadings, renderMarkdown, textLength } from "@/lib/blog/render";

describe("renderMarkdown", () => {
  it("renders GFM tables, code fences with language classes and slugged headings", async () => {
    const html = await renderMarkdown(
      ["## 見出し", "", "| a | b |", "|---|---|", "| 1 | 2 |", "", "```ts", "const x = 1;", "```", "", "### Sub"].join("\n"),
    );
    expect(html).toContain('<h2 id="見出し">見出し</h2>');
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain('<h3 id="sub">Sub</h3>');
  });

  it("drops raw HTML, scripts, inline handlers and javascript: links", async () => {
    const html = await renderMarkdown(
      ['<script>alert(1)</script>', "", '<img src=x onerror="alert(1)">', "", "[x](javascript:alert(1))", "", "[ok](https://example.com)"].join("\n"),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('<a href="https://example.com">ok</a>');
  });

  it("does not prefix heading ids", async () => {
    const html = await renderMarkdown("## Topic");
    expect(html).toContain('id="topic"');
    expect(html).not.toContain("user-content");
  });
});

describe("extractHeadings", () => {
  it("lists h2 and h3 in document order with tags stripped from the text", () => {
    const html = '<h2 id="a">A <code>x</code></h2><p>t</p><h3 id="b">B</h3><h4 id="c">C</h4>';
    expect(extractHeadings(html)).toEqual([
      { level: 2, id: "a", text: "A x" },
      { level: 3, id: "b", text: "B" },
    ]);
  });
});

describe("textLength", () => {
  it("counts visible characters only", () => {
    expect(textLength("<p>あい う</p>\n<pre><code>x y</code></pre>")).toBe(5);
  });
});
