/** Builds the per-request Content-Security-Policy. Scripts run only with the request's nonce
 *  ('strict-dynamic' lets them load their own chunks); the host entry is a CSP2 fallback. */
export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
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

/** A fresh base64 nonce (128 bits of randomness from a UUID). */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/** Strict CSP for the paths src/proxy.ts skips (static files and generated images). They
 *  never need scripts, so nothing but same-origin images and inline styles is allowed. */
export const FALLBACK_CSP = [
  "default-src 'none'",
  "img-src 'self' data:",
  "style-src 'unsafe-inline'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

/** next.config `headers()` sources that get FALLBACK_CSP. Must stay in sync with the
 *  exclusions in the proxy matcher (checked by src/proxy.test.ts) so each path has one CSP. */
export const FALLBACK_CSP_SOURCES = [
  "/_next/static/:path*",
  "/_next/image",
  "/favicon.ico",
  "/icon.svg",
  "/opengraph-image",
  "/api/og/:path*",
  "/og/:path*",
  "/favicons/:path*",
];
