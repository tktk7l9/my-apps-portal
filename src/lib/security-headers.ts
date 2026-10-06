// Security headers shared by the Worker (next.config.ts) and the static assets
// (public/_headers, written by scripts/export-static.mjs). "/" and the eyecatch images
// are served as static assets without running the Worker, so both paths need them.

import { createHash } from "node:crypto";

export type Header = { key: string; value: string };

/** Origin of the Cloudflare Web Analytics beacon, which src/components/Analytics.tsx injects at runtime. */
export const BEACON_ORIGIN = "https://static.cloudflareinsights.com";

/**
 * Without `scriptHashes` the policy keeps 'unsafe-inline' in script-src: the Worker answers
 * the few routes that are not static assets (404, RSC fallbacks, /api/*), and their inline
 * scripts are only known after `next build`, which is after next.config.ts is read.
 * With `scriptHashes` (static HTML pages, see scripts/export-static.mjs) only the listed
 * inline scripts may run.
 */
export function buildCsp(isDev: boolean, scriptHashes?: string[]): string {
  const inline = scriptHashes ? scriptHashes.map((hash) => `'${hash}'`).join(" ") : "'unsafe-inline'";
  return [
    "default-src 'self'",
    [`script-src 'self'`, inline, BEACON_ORIGIN, isDev ? "'unsafe-eval'" : ""].filter(Boolean).join(" "),
    "connect-src 'self' https://cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.saitotakuya0719.workers.dev",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(isDev: boolean): Header[] {
  return [
    { key: "Content-Security-Policy", value: buildCsp(isDev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    // No window.open / cross-origin popups are used, so a separate browsing-context group is free
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}

/**
 * Next.js emits content-hashed file names under /_next/static, so the files never change
 * under the same URL. Workers Assets would otherwise serve them with max-age=0 and revalidate
 * on every navigation.
 */
export const staticAssetCacheRule = {
  path: "/_next/static/*",
  headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
} as const;

/** Body of a Workers static assets `_headers` file: one block of headers per path pattern. */
export function headersFile(rules: { path: string; headers: Header[] }[]): string {
  return rules
    .map(({ path, headers }) => [path, ...headers.map(({ key, value }) => `  ${key}: ${value}`)].join("\n"))
    .join("\n")
    .concat("\n");
}

/**
 * CSP hash sources ("sha256-…") for every inline script a prerendered HTML page executes
 * (Next's RSC payload pushes). Data blocks such as JSON-LD are not executed, so CSP does not
 * apply to them and they are skipped. The hash covers the exact text between the tags, which
 * is what the browser hashes because static assets are served byte for byte.
 */
export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1].toLowerCase();
    if (type && type !== "module" && !type.includes("javascript")) continue;
    hashes.add(`sha256-${createHash("sha256").update(body, "utf8").digest("base64")}`);
  }
  return [...hashes];
}
