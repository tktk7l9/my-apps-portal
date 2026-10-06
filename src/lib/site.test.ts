import { describe, expect, it } from "vitest";
import { absoluteUrl, SITE_URL } from "@/lib/site";

describe("absoluteUrl", () => {
  it("prefixes a site path with the canonical origin", () => {
    expect(absoluteUrl("/blog/x")).toBe(`${SITE_URL}/blog/x`);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
