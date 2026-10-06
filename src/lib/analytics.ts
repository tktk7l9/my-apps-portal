// Client-side module: it must not import security-headers.ts (node:crypto). The CSP allows
// this origin as BEACON_ORIGIN there; analytics.test.ts keeps the two in sync.
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

/**
 * Cloudflare Web Analytics site token. It is an identifier meant to be public, not a secret.
 * gitleaks flags a 32-digit hex as generic-api-key, so gitleaks:allow on the line suppresses
 * it; a .gitleaks.toml would replace the whole default ruleset instead.
 */
export const beaconToken = "cd156fbf0fd24da0a12e58fdb4e63828"; // gitleaks:allow
