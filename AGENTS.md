<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## npm audit

- CI runs `node scripts/audit-gate.mjs` instead of a bare `npm audit`. It fails on any advisory not listed in
  `audit-allowlist.json`. An entry needs a reason and an `expires` date (keep it about a month out), and
  `devOnly: true` stops matching once the package becomes reachable from production dependencies. The gate also
  fails when an allowlisted advisory gets a fix, so the entry is removed by updating rather than forgotten.

## Static home page and eyecatches

- `/`, `/icon.svg`, `/opengraph-image` and `/api/og/<id>.png` are prerendered by `next build` and copied into
  `public/` by `scripts/export-static.mjs` (the `build` script), so OpenNext ships them as Workers static assets.
  Static assets are served without running the Worker; rendering per request exceeded the free plan's CPU
  limit (error 1102). Do not make these routes dynamic.
- Security headers live in `src/lib/security-headers.ts`: next.config.ts applies them to Worker responses and
  the script writes them to `public/_headers` for static assets.
- Data on `/` is as fresh as the last build. `.github/workflows/rebuild.yml` calls the Workers Builds deploy hook
  every 3 hours (repository secret `DEPLOY_HOOK_URL`).
