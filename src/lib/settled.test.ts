import { describe, expect, it } from "vitest";
import { fulfilledEntries } from "@/lib/settled";

describe("fulfilledEntries", () => {
  it("keeps fulfilled entries and drops rejected ones", async () => {
    const results = await Promise.allSettled([
      Promise.resolve<[string, string]>(["a", "1"]),
      Promise.reject(new Error("x")),
      Promise.resolve<[string, string]>(["b", "2"]),
    ]);
    expect(fulfilledEntries(results)).toEqual({ a: "1", b: "2" });
  });
});
