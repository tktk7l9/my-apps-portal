import { describe, expect, it } from "vitest";
import { UPSTREAM_TIMEOUT_MS, upstreamSignal } from "@/lib/upstream";

describe("upstreamSignal", () => {
  it("returns a fresh, not yet aborted signal per call", () => {
    const first = upstreamSignal();
    const second = upstreamSignal();
    expect(first).toBeInstanceOf(AbortSignal);
    expect(first.aborted).toBe(false);
    expect(first).not.toBe(second);
  });

  it("stays within the Workers Builds per-build budget", () => {
    expect(UPSTREAM_TIMEOUT_MS).toBeGreaterThan(0);
    expect(UPSTREAM_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
