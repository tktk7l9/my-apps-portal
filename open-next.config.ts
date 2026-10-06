// OpenNext (Cloudflare) config.
//
// incrementalCache: prerendered pages (/blog, /blog/<slug>, feed.xml, index.json, sitemap)
// are read through Next's incremental cache at request time. Without a cache implementation
// OpenNext cannot find the prerender output and statically generated dynamic segments answer
// 404 in production while plain routes keep working (hit in service-anatomy). The static
// assets cache is read-only and serves exactly what `next build` produced, which is all this
// site needs: there is no ISR / on-demand revalidation, the site is rebuilt on a schedule.
//
// Most of these routes are additionally copied into public/ by scripts/export-static.mjs so
// the common path never runs the Worker at all; the cache is the fallback (e.g. RSC payloads).
// https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
