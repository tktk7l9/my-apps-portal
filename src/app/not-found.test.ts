import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("puts a Japanese heading inside one main landmark and offers ways back", () => {
    const html = renderToStaticMarkup(createElement(NotFound));

    expect(html.match(/<main>/g)).toHaveLength(1);
    expect(html).toMatch(/<main>[\s\S]*<h1[^>]*>ページが見つかりません<\/h1>[\s\S]*<\/main>/);
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/"');
  });
});
