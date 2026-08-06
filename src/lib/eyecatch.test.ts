import { describe, expect, it } from "vitest";
import { eyecatchSrc } from "@/lib/eyecatch";

describe("eyecatchSrc", () => {
  it("ogImage が設定されていればそれをそのまま使う", () => {
    expect(eyecatchSrc({ ogImage: "/og/service-anatomy.png" })).toBe(
      "/og/service-anatomy.png"
    );
  });

  it("liveUrl があっても ogImage を優先する（bot 対策で取得できないサイト向け）", () => {
    expect(
      eyecatchSrc({
        ogImage: "/og/service-anatomy.png",
        liveUrl: "https://service-anatomy.vercel.app",
      })
    ).toBe("/og/service-anatomy.png");
  });

  it("ogImage が無ければ liveUrl を OGP プロキシ経由で取る", () => {
    expect(eyecatchSrc({ liveUrl: "https://skydial.vercel.app" })).toBe(
      "/api/ogp?url=https%3A%2F%2Fskydial.vercel.app"
    );
  });

  it("liveUrl はクエリ文字列として安全にエンコードする", () => {
    expect(eyecatchSrc({ liveUrl: "https://example.com/a?b=1&c=2" })).toBe(
      "/api/ogp?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%26c%3D2"
    );
  });

  it("どちらも無ければ null（呼び出し側が emoji にフォールバックする）", () => {
    expect(eyecatchSrc({})).toBeNull();
  });
});
