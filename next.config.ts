import type { NextConfig } from "next";
import { FALLBACK_CSP, FALLBACK_CSP_SOURCES } from "./src/lib/csp";

// The page CSP is set per request in src/proxy.ts (nonce-based). Paths the proxy skips get
// a strict static CSP here, so every path carries exactly one CSP header.

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      ...FALLBACK_CSP_SOURCES.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: FALLBACK_CSP }],
      })),
    ];
  },
};

export default nextConfig;
