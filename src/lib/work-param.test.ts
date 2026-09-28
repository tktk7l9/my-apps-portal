import { describe, expect, it } from "vitest";
import { readWorkParam, withWorkParam } from "@/lib/work-param";

describe("readWorkParam", () => {
  it("returns the work id from the query string", () => {
    expect(readWorkParam("?work=skydial")).toBe("skydial");
  });

  it("returns null when the parameter is missing or empty", () => {
    expect(readWorkParam("")).toBeNull();
    expect(readWorkParam("?foo=1")).toBeNull();
    expect(readWorkParam("?work=")).toBeNull();
  });
});

describe("withWorkParam", () => {
  it("adds the work parameter while keeping other params and the hash", () => {
    expect(withWorkParam("https://example.com/?a=1#top", "skydial")).toBe("/?a=1&work=skydial#top");
  });

  it("replaces an existing work parameter", () => {
    expect(withWorkParam("https://example.com/?work=old", "new")).toBe("/?work=new");
  });

  it("removes the parameter when id is null", () => {
    expect(withWorkParam("https://example.com/?work=old&a=1", null)).toBe("/?a=1");
    expect(withWorkParam("https://example.com/?work=old", null)).toBe("/");
  });
});
