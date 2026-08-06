import { describe, expect, it } from "vitest";
import { toParagraphs } from "@/lib/paragraphs";

describe("toParagraphs", () => {
  it("改行が無ければ1段落", () => {
    expect(toParagraphs("単一の説明文。")).toEqual(["単一の説明文。"]);
  });

  it("空行（\\n\\n）で段落を分ける", () => {
    expect(toParagraphs("一段落目。\n\n二段落目。")).toEqual([
      "一段落目。",
      "二段落目。",
    ]);
  });

  it("単一改行でも段落として扱う（書き分けの揺れを許容）", () => {
    expect(toParagraphs("一段落目。\n二段落目。")).toEqual([
      "一段落目。",
      "二段落目。",
    ]);
  });

  it("3つ以上の改行が連続しても空段落を作らない", () => {
    expect(toParagraphs("A。\n\n\n\nB。")).toEqual(["A。", "B。"]);
  });

  it("各段落の前後の空白を落とす", () => {
    expect(toParagraphs("  A。  \n\n  B。  ")).toEqual(["A。", "B。"]);
  });

  it("空文字は段落ゼロ", () => {
    expect(toParagraphs("")).toEqual([]);
  });

  it("空白と改行だけなら段落ゼロ", () => {
    expect(toParagraphs("  \n \n  ")).toEqual([]);
  });
});
