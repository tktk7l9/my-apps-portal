import { describe, expect, it } from "vitest";
import { parseDeclaredVersion } from "@/lib/version-spec";

describe("parseDeclaredVersion", () => {
  it("returns exact versions as-is", () => {
    expect(parseDeclaredVersion("16.3.5")).toEqual({ version: "16.3.5", isRange: false });
  });

  it("strips range operators and marks them as ranges", () => {
    expect(parseDeclaredVersion("^19.3.0")).toEqual({ version: "19.3.0", isRange: true });
    expect(parseDeclaredVersion("~5.0")).toEqual({ version: "5.0", isRange: true });
    expect(parseDeclaredVersion(">= 4.1.0")).toEqual({ version: "4.1.0", isRange: true });
    expect(parseDeclaredVersion("^26")).toEqual({ version: "26", isRange: true });
  });

  it("keeps x-wildcard versions (they are version numbers, just not checkable)", () => {
    expect(parseDeclaredVersion("16.x")).toEqual({ version: "16.x", isRange: false });
  });

  it("returns null for specs that are not a version number", () => {
    expect(parseDeclaredVersion("latest")).toBeNull();
    expect(parseDeclaredVersion("workspace:*")).toBeNull();
    expect(parseDeclaredVersion("github:foo/bar")).toBeNull();
    expect(parseDeclaredVersion("*")).toBeNull();
    expect(parseDeclaredVersion(undefined)).toBeNull();
    expect(parseDeclaredVersion("")).toBeNull();
  });
});
