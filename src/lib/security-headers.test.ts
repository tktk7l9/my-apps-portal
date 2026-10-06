import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  buildCsp,
  headersFile,
  inlineScriptHashes,
  securityHeaders,
  staticAssetCacheRule,
} from "@/lib/security-headers";

const sha256 = (text: string) => `sha256-${createHash("sha256").update(text, "utf8").digest("base64")}`;

describe("buildCsp", () => {
  it("adds 'unsafe-eval' only in development", () => {
    expect(buildCsp(true)).toContain("'unsafe-eval'");
    expect(buildCsp(false)).not.toContain("'unsafe-eval'");
    expect(buildCsp(false)).toContain("frame-ancestors 'none'");
  });

  it("keeps 'unsafe-inline' in script-src for Worker responses without hashes", () => {
    expect(buildCsp(false)).toContain("script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;");
  });

  it("allows only the hashed inline scripts when hashes are given", () => {
    const csp = buildCsp(false, ["sha256-a", "sha256-b"]);
    expect(csp).toContain("script-src 'self' 'sha256-a' 'sha256-b' https://static.cloudflareinsights.com;");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("allows no inline script at all with an empty hash list", () => {
    expect(buildCsp(false, [])).toContain("script-src 'self' https://static.cloudflareinsights.com;");
  });

  it("restricts base-uri, form-action, frame-ancestors and object-src", () => {
    const csp = buildCsp(false, []);
    for (const directive of ["base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'"]) {
      expect(csp).toContain(directive);
    }
  });
});

describe("inlineScriptHashes", () => {
  it("hashes the exact text of each executable inline script once", () => {
    const html =
      "<script>self.__next_f=[]</script><SCRIPT type=\"module\">a()</SCRIPT>" +
      "<script type='text/javascript'>b()</script><script>self.__next_f=[]</script>";
    expect(inlineScriptHashes(html)).toEqual([sha256("self.__next_f=[]"), sha256("a()"), sha256("b()")]);
  });

  it("hashes multi-byte text as UTF-8", () => {
    expect(inlineScriptHashes("<script>x('日本語')</script>")).toEqual([sha256("x('日本語')")]);
  });

  it("skips external scripts and data blocks such as JSON-LD", () => {
    const html =
      '<script src="/a.js"></script><script async src=/b.js>ignored</script>' +
      '<script type="application/ld+json">{"@type":"BlogPosting"}</script>';
    expect(inlineScriptHashes(html)).toEqual([]);
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
      "Cross-Origin-Opener-Policy",
    ]);
  });
});

describe("staticAssetCacheRule", () => {
  it("marks the content-hashed /_next/static files immutable for a year", () => {
    expect(staticAssetCacheRule.path).toBe("/_next/static/*");
    expect(staticAssetCacheRule.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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

  it("writes detached headers as '! Name' before the headers it sets", () => {
    expect(
      headersFile([{ path: "/", detach: ["Content-Security-Policy"], headers: [{ key: "Content-Security-Policy", value: "x" }] }])
    ).toBe("/\n  ! Content-Security-Policy\n  Content-Security-Policy: x\n");
  });
});
