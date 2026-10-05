import { describe, expect, it } from "vitest";
import { buildCsp, headersFile, securityHeaders } from "@/lib/security-headers";

describe("buildCsp", () => {
  it("adds 'unsafe-eval' only in development", () => {
    expect(buildCsp(true)).toContain("'unsafe-eval'");
    expect(buildCsp(false)).not.toContain("'unsafe-eval'");
    expect(buildCsp(false)).toContain("frame-ancestors 'none'");
  });
});

describe("securityHeaders", () => {
  it("includes the CSP, HSTS and nosniff", () => {
    const keys = securityHeaders(false).map((h) => h.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]);
  });
});

describe("headersFile", () => {
  it("writes one indented block per path", () => {
    expect(
      headersFile([
        { path: "/*", headers: [{ key: "A", value: "1" }, { key: "B", value: "2" }] },
        { path: "/x", headers: [{ key: "C", value: "3" }] },
      ])
    ).toBe("/*\n  A: 1\n  B: 2\n/x\n  C: 3\n");
  });
});
