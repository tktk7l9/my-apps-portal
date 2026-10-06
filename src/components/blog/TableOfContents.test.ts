import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { renderMarkdown } from "@/lib/blog/render";

describe("TableOfContents", () => {
  it("renders heading text as text, so markup in a heading stays inert", async () => {
    const { headings } = await renderMarkdown(
      ["## `<img src=x onerror=alert(1)>` は文字", "", "## a < b & \"c\"", "", "## 参考"].join("\n"),
    );
    const html = renderToStaticMarkup(createElement(TableOfContents, { headings }));

    expect(html).toContain(">&lt;img src=x onerror=alert(1)&gt; は文字</a>");
    expect(html).toContain(">a &lt; b &amp; &quot;c&quot;</a>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("&amp;#x3C;");
  });
});
