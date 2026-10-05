import { describe, expect, it } from "vitest";
import { toParagraphs } from "@/lib/paragraphs";

describe("toParagraphs", () => {
  it("is one paragraph without line breaks", () => {
    expect(toParagraphs("単一の説明文。")).toEqual(["単一の説明文。"]);
  });

  it("splits paragraphs on blank lines (\\n\\n)", () => {
    expect(toParagraphs("一段落目。\n\n二段落目。")).toEqual([
      "一段落目。",
      "二段落目。",
    ]);
  });

  it("treats a single line break as a paragraph break too (tolerates inconsistent writing)", () => {
    expect(toParagraphs("一段落目。\n二段落目。")).toEqual([
      "一段落目。",
      "二段落目。",
    ]);
  });

  it("does not create empty paragraphs from 3 or more consecutive line breaks", () => {
    expect(toParagraphs("A。\n\n\n\nB。")).toEqual(["A。", "B。"]);
  });

  it("trims whitespace around each paragraph", () => {
    expect(toParagraphs("  A。  \n\n  B。  ")).toEqual(["A。", "B。"]);
  });

  it("returns no paragraphs for an empty string", () => {
    expect(toParagraphs("")).toEqual([]);
  });

  it("returns no paragraphs for whitespace and line breaks only", () => {
    expect(toParagraphs("  \n \n  ")).toEqual([]);
  });
});
