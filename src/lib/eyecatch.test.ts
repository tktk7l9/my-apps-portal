import { describe, expect, it } from "vitest";
import { eyecatchSrc, generatedEyecatchIds, projectIdFromEyecatchParam } from "@/lib/eyecatch";

describe("eyecatchSrc", () => {
  it("uses ogImage as is when it is set", () => {
    expect(eyecatchSrc({ ogImage: "/og/service-anatomy.png" })).toBe(
      "/og/service-anatomy.png"
    );
  });

  it("prefers ogImage even with a liveUrl (for sites whose bot protection blocks fetching)", () => {
    expect(
      eyecatchSrc({
        ogImage: "/og/service-anatomy.png",
        liveUrl: "https://service-anatomy.vercel.app",
      })
    ).toBe("/og/service-anatomy.png");
  });

  it("falls back to the liveUrl through the OGP proxy when there is no ogImage", () => {
    expect(eyecatchSrc({ liveUrl: "https://skydial.vercel.app" })).toBe(
      "/api/ogp?url=https%3A%2F%2Fskydial.vercel.app"
    );
  });

  it("encodes the liveUrl safely as a query string", () => {
    expect(eyecatchSrc({ liveUrl: "https://example.com/a?b=1&c=2" })).toBe(
      "/api/ogp?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%26c%3D2"
    );
  });

  it("returns null when neither exists (the caller falls back to an emoji)", () => {
    expect(eyecatchSrc({})).toBeNull();
  });
});

describe("generatedEyecatchIds", () => {
  it("lists only projects whose ogImage points at their own generated image", () => {
    expect(
      generatedEyecatchIds([
        { id: "a", ogImage: "/api/og/a.png" },
        { id: "b", ogImage: "/og/b.png" },
        { id: "c", ogImage: "/api/og/a.png" },
        { id: "d" },
      ])
    ).toEqual(["a"]);
  });
});

describe("projectIdFromEyecatchParam", () => {
  it("strips the .png suffix and keeps the older extensionless form working", () => {
    expect(projectIdFromEyecatchParam("roba-hud.png")).toBe("roba-hud");
    expect(projectIdFromEyecatchParam("roba-hud")).toBe("roba-hud");
  });
});
