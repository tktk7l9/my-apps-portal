/**
 * Timeout for the build-time fetches that feed "/" (npm registry, OSV, GitHub). Each request
 * already runs under Promise.allSettled / try-catch, so a failure only costs that one value;
 * without a timeout, one stalled connection could hang `next build` on Workers Builds for the
 * whole build timeout instead. /api/ogp has its own, shorter limit in ogp.ts.
 */
export const UPSTREAM_TIMEOUT_MS = 15_000;

/** A fresh signal per request: an AbortSignal cannot be shared between fetches. */
export function upstreamSignal(): AbortSignal {
  return AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
}
