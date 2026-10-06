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

- `/`, `/icon.svg`, `/opengraph-image`, `/api/og/<id>.png`, `/sitemap.xml`, `/robots.txt` and the whole blog
  (`/blog`, `/blog/<slug>`, its OG images, `feed.xml`, `index.json`) are prerendered by `next build` and copied into
  `public/` by `scripts/export-static.mjs` (the `build` script), so OpenNext ships them as Workers static assets.
  Static assets are served without running the Worker; rendering per request exceeded the free plan's CPU
  limit (error 1102). Do not make these routes dynamic.
- Security headers live in `src/lib/security-headers.ts`: next.config.ts applies them to Worker responses and
  the script writes them to `public/_headers` for static assets.
- Static HTML pages get a per-page CSP in `_headers` whose script-src lists the sha256 of each inline script
  (Next's RSC payload) instead of `'unsafe-inline'`; the script recomputes them on every build. Never edit a
  copied HTML file after hashing, and keep `_headers` under 100 rules (the script throws). Exactly one rule may
  set the CSP for a path: "/*" carries none, because detaching it in a page rule failed on the edge for "/"
  (two policies, both enforced). A new non-HTML folder in public/ needs an entry in `strictPaths`. Worker responses
  (404, `/api/*`) still allow `'unsafe-inline'`, because next.config.ts is read before the build exists.
- The Cloudflare Web Analytics beacon is appended at runtime by `src/components/Analytics.tsx`, not written
  as a `<script src>`: it cannot carry SRI, and Observatory deducts for external scripts without it.
- Data on `/` is as fresh as the last build. `.github/workflows/rebuild.yml` calls the Workers Builds deploy hook
  every 3 hours (repository secret `DEPLOY_HOOK_URL`).

## Blog

- Articles are Markdown files in `content/blog/<slug>.md` with frontmatter `title`, `date`, optional `updated`,
  `summary`, `tags`, `apps` (ids from `src/lib/projects/data.ts`) and `sources`. The parser is the YAML subset in
  `src/lib/blog/frontmatter.ts`; `src/lib/blog/content.test.ts` validates every article (schema, dates, app ids,
  internal links, length, a closing `## 参考` section) and runs in the coverage gate.
- Rendering is build-time only (`remark-gfm` → `rehype-sanitize`); `content/` does not exist on the Worker, so
  nothing may read it at request time. Pages use `generateStaticParams` + `dynamicParams = false`; route handlers
  are `force-static`.
- `open-next.config.ts` sets `incrementalCache: staticAssetsIncrementalCache` so the Worker can still serve
  prerendered pages that are not in `public/`; without it, statically generated dynamic segments answer 404.
- Blog pages link with plain `<a>` (not `next/link`): static assets answer by path, so an RSC prefetch would get HTML.
- Only facts from public repositories, READMEs, commit messages or `data.ts` go into articles. No personal, family,
  financial, health, employment or client-identifying information; the client project stays anonymised as in `data.ts`.
