import { describe, expect, it } from "vitest";
import { config } from "@/proxy";
import { FALLBACK_CSP_SOURCES } from "@/lib/csp";

// Mirrors how the sources are matched against a pathname: the proxy matcher is a regex,
// the next.config sources use :path* for "anything below".
const proxyMatches = (path: string) => new RegExp(`^${config.matcher[0].source}$`).test(path);
const fallbackMatches = (path: string) =>
  FALLBACK_CSP_SOURCES.some((source) =>
    new RegExp(`^${source.replace(/\./g, "\\.").replace("/:path*", "(/.*)?")}$`).test(path)
  );

describe("CSP coverage", () => {
  const pages = ["/", "/?work=my-apps-portal", "/nope", "/api/ogp", "/api/ogp?url=x", "/ogp-like"];
  const skipped = [
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/icon.svg",
    "/opengraph-image",
    "/api/og/roba-hud",
    "/og/service-anatomy.webp",
    "/favicons/my-apps-portal.svg",
  ];

  it.each(pages)("%s gets the nonce CSP from the proxy only", (path) => {
    const pathname = path.split("?")[0];
    expect(proxyMatches(pathname)).toBe(true);
    expect(fallbackMatches(pathname)).toBe(false);
  });

  it.each(skipped)("%s gets the static fallback CSP only", (path) => {
    expect(proxyMatches(path)).toBe(false);
    expect(fallbackMatches(path)).toBe(true);
  });
});

describe("public/_headers", () => {
  it("repeats FALLBACK_CSP for the static asset folders", async () => {
    const { readFileSync } = await import("node:fs");
    const { FALLBACK_CSP } = await import("@/lib/csp");
    const file = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
    const values = file.match(/Content-Security-Policy: (.*)/g) ?? [];
    expect(values).toHaveLength(2);
    for (const line of values) expect(line).toBe(`Content-Security-Policy: ${FALLBACK_CSP}`);
  });
});
