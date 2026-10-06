import { describe, expect, it } from "vitest";
import { blogListHref, readTagParam } from "@/lib/blog/tag-param";

describe("readTagParam", () => {
  it("returns the tag or null when absent or empty", () => {
    expect(readTagParam("?tag=cloudflare")).toBe("cloudflare");
    expect(readTagParam("?tag=")).toBeNull();
    expect(readTagParam("")).toBeNull();
  });
});

describe("blogListHref", () => {
  it("builds the list URL with or without a tag", () => {
    expect(blogListHref(null)).toBe("/blog");
    expect(blogListHref("a b")).toBe("/blog?tag=a%20b");
  });
});
