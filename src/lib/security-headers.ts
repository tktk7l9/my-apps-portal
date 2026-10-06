// Security headers shared by the Worker (next.config.ts) and the static assets
// (public/_headers, written by scripts/export-static.mjs). "/" and the eyecatch images
// are served as static assets without running the Worker, so both paths need them.

export type Header = { key: string; value: string };

export function buildCsp(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
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
