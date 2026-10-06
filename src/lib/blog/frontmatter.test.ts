import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "@/lib/blog/frontmatter";

const doc = (yaml: string, body = "body") => `---\n${yaml}\n---\n${body}`;

describe("parseFrontmatter", () => {
  it("parses scalars, inline lists and block lists", () => {
    const { data, body } = parseFrontmatter(
      doc(['title: "Hello: world"', "date: 2026-10-06", "tags: [a, 'b c', \"d,e\"]", "apps:", "  - skydial", "  - lumen-bloom", "empty: []"].join("\n"), "# Heading\n\ntext"),
    );
    expect(data).toEqual({
      title: "Hello: world",
      date: "2026-10-06",
      tags: ["a", "b c", "d,e"],
      apps: ["skydial", "lumen-bloom"],
      empty: [],
    });
    expect(body).toBe("# Heading\n\ntext");
  });

  it("accepts CRLF line endings and blank lines inside the frontmatter", () => {
    const { data, body } = parseFrontmatter("---\r\ntitle: x\r\n\r\nlist:\r\n  - one\r\n---\r\nbody");
    expect(data).toEqual({ title: "x", list: ["one"] });
    expect(body).toBe("body");
  });

  it("keeps a key with no value as an empty list when no items follow", () => {
    expect(parseFrontmatter(doc("tags:")).data).toEqual({ tags: [] });
  });

  it("rejects files without an opening or closing delimiter", () => {
    expect(() => parseFrontmatter("title: x\n---\n")).toThrow("must start with ---");
    expect(() => parseFrontmatter("---\ntitle: x\n")).toThrow("closing --- not found");
  });

  it("rejects list items without a key, unparsable lines and duplicate keys", () => {
    expect(() => parseFrontmatter(doc("  - orphan"))).toThrow("list item without a key");
    expect(() => parseFrontmatter(doc("not yaml"))).toThrow("cannot parse line 2");
    expect(() => parseFrontmatter(doc("a: 1\na: 2"))).toThrow('duplicate key "a"');
  });

  it("rejects empty or unterminated list items", () => {
    expect(() => parseFrontmatter(doc("tags: [a, ]"))).toThrow('empty item in "tags"');
    expect(() => parseFrontmatter(doc("tags:\n  - ''"))).toThrow('empty item in "tags"');
    expect(() => parseFrontmatter(doc("tags: ['a]"))).toThrow("unterminated quote");
  });
});
