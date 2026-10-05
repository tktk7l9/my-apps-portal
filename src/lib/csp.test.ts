import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "@/lib/csp";

describe("buildCsp", () => {
  it("allows scripts only through the nonce, without 'unsafe-inline'", () => {
    const csp = buildCsp("abc", false);
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toBe(
      "script-src 'self' 'nonce-abc' 'strict-dynamic' https://static.cloudflareinsights.com"
    );
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("adds 'unsafe-eval' only in development", () => {
    expect(buildCsp("abc", true)).toContain("'unsafe-eval'");
    expect(buildCsp("abc", false)).not.toContain("'unsafe-eval'");
  });
});

describe("createNonce", () => {
  it("returns a different base64 value each call", () => {
    const a = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(createNonce()).not.toBe(a);
  });
});
