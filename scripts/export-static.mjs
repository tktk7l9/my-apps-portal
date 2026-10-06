// Copies build output that Next.js prerendered into public/, so OpenNext ships it as Workers
// static assets. Static assets are served without running the Worker, which keeps "/", the
// blog and the generated eyecatch images off the free plan's per-request CPU limit (error 1102).
//
//   npm run build  →  prebuild: --clean  →  next build  →  this script
//
// OpenNext runs `npm run build` and then copies public/ into .open-next/assets.
// Everything written here is listed in .gitignore and removed again by --clean, because
// Next.js refuses to build when a public file shadows a route.
//
// Workers assets use the default html_handling (auto-trailing-slash): "blog.html" answers
// /blog and "blog/<slug>.html" answers /blog/<slug>, matching Next's trailing-slash-less URLs.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Node 24 strips types when importing a .ts module, so the header list stays in one place.
import { headersFile, securityHeaders, staticAssetCacheRule } from "../src/lib/security-headers.ts";

const root = join(import.meta.dirname, "..");
const app = join(root, ".next/server/app");
const pub = join(root, "public");

const GENERATED = [
  "index.html",
  "icon.svg",
  "opengraph-image",
  "api",
  "_headers",
  "blog.html",
  "blog",
  "sitemap.xml",
  "robots.txt",
];

for (const entry of GENERATED) rmSync(join(pub, entry), { recursive: true, force: true });
if (process.argv.includes("--clean")) process.exit(0);

function copy(from, to) {
  const src = join(app, from);
  if (!existsSync(src)) throw new Error(`export-static: missing build output ${from}`);
  mkdirSync(dirname(join(pub, to)), { recursive: true });
  cpSync(src, join(pub, to));
}

copy("index.html", "index.html");
copy("icon.svg.body", "icon.svg");
copy("opengraph-image.body", "opengraph-image");
copy("sitemap.xml.body", "sitemap.xml");
copy("robots.txt.body", "robots.txt");
const eyecatches = readdirSync(join(app, "api/og")).filter((name) => name.endsWith(".png.body"));
if (eyecatches.length === 0) throw new Error("export-static: no prerendered /api/og images");
for (const name of eyecatches) copy(`api/og/${name}`, `api/og/${name.replace(/\.body$/, "")}`);

// Blog: list page, every article, its OG image, the feed and the JSON index.
copy("blog.html", "blog.html");
copy("blog/feed.xml.body", "blog/feed.xml");
copy("blog/index.json.body", "blog/index.json");
const articles = readdirSync(join(app, "blog")).filter((name) => name.endsWith(".html"));
if (articles.length === 0) throw new Error("export-static: no prerendered /blog articles");
const ogImages = [];
for (const name of articles) {
  copy(`blog/${name}`, `blog/${name}`);
  const slug = name.replace(/\.html$/, "");
  const og = `blog/${slug}/opengraph-image.body`;
  if (existsSync(join(app, og))) {
    copy(og, `blog/${slug}/opengraph-image`);
    ogImages.push(`/blog/${slug}/opengraph-image`);
  }
}

const headers = securityHeaders(false);
const contentTypes = [
  { path: "/opengraph-image", type: "image/png" },
  ...ogImages.map((path) => ({ path, type: "image/png" })),
  { path: "/blog/feed.xml", type: "application/rss+xml; charset=utf-8" },
  { path: "/sitemap.xml", type: "application/xml; charset=utf-8" },
];
writeFileSync(
  join(pub, "_headers"),
  headersFile([
    { path: "/*", headers },
    staticAssetCacheRule,
    ...contentTypes.map(({ path, type }) => ({ path, headers: [{ key: "Content-Type", value: type }] })),
  ])
);
console.log(
  `export-static: index.html, icon.svg, opengraph-image, sitemap.xml, robots.txt, ${eyecatches.length} eyecatches, ` +
    `blog (${articles.length} articles, ${ogImages.length} OG images, feed.xml, index.json), _headers`
);
