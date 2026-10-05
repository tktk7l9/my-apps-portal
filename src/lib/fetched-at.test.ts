import { describe, expect, it } from "vitest";
import { formatJst } from "@/lib/fetched-at";

describe("formatJst", () => {
  it("formats a UTC instant in Japan time", () => {
    expect(formatJst(new Date("2026-10-05T15:04:00Z"))).toBe("2026-10-06 00:04");
  });
});
