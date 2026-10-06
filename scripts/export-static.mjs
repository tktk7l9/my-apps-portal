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
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Node 24 strips types when importing a .ts module, so the header list stays in one place.
import {
  buildCsp,
  headersFile,
  inlineScriptHashes,
  securityHeaders,
  staticAssetCacheRule,
} from "../src/lib/security-headers.ts";

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

// HTML pages and the URL path they answer, for their per-page CSP.
const pages = [];
function copyPage(from, to, path) {
  copy(from, to);
  pages.push({ path, file: join(pub, to) });
}

copyPage("index.html", "index.html", "/");
copy("icon.svg.body", "icon.svg");
copy("opengraph-image.body", "opengraph-image");
copy("sitemap.xml.body", "sitemap.xml");
copy("robots.txt.body", "robots.txt");
const eyecatches = readdirSync(join(app, "api/og")).filter((name) => name.endsWith(".png.body"));
if (eyecatches.length === 0) throw new Error("export-static: no prerendered /api/og images");
for (const name of eyecatches) copy(`api/og/${name}`, `api/og/${name.replace(/\.body$/, "")}`);

// Blog: list page, every article, its OG image, the feed and the JSON index.
copyPage("blog.html", "blog.html", "/blog");
copy("blog/feed.xml.body", "blog/feed.xml");
copy("blog/index.json.body", "blog/index.json");
const articles = readdirSync(join(app, "blog")).filter((name) => name.endsWith(".html"));
if (articles.length === 0) throw new Error("export-static: no prerendered /blog articles");
const ogImages = [];
for (const name of articles) {
  const slug = name.replace(/\.html$/, "");
  copyPage(`blog/${name}`, `blog/${name}`, `/blog/${slug}`);
  const og = `blog/${slug}/opengraph-image.body`;
  if (existsSync(join(app, og))) {
    copy(og, `blog/${slug}/opengraph-image`);
    ogImages.push(`/blog/${slug}/opengraph-image`);
  }
}

// Every path gets the strict policy, which allows no inline script at all. Each HTML page
// detaches it ("! Content-Security-Policy") and sets a policy that allows exactly the inline
// scripts it ships (Next's RSC payload), by hash. Static assets never run the Worker, so a
// per-request nonce is not an option; the hashes are fixed at build time like the HTML.
const strict = securityHeaders(false).map((header) =>
  header.key === "Content-Security-Policy" ? { ...header, value: buildCsp(false, []) } : header
);
const pageRules = pages.map(({ path, file }) => ({
  path,
  detach: ["Content-Security-Policy"],
  headers: [{ key: "Content-Security-Policy", value: buildCsp(false, inlineScriptHashes(readFileSync(file, "utf8"))) }],
}));
const contentTypes = [
  { path: "/opengraph-image", type: "image/png" },
  ...(ogImages.length > 0 ? [{ path: "/blog/:slug/opengraph-image", type: "image/png" }] : []),
  { path: "/blog/feed.xml", type: "application/rss+xml; charset=utf-8" },
  { path: "/sitemap.xml", type: "application/xml; charset=utf-8" },
];
const rules = [
  { path: "/*", headers: strict },
  staticAssetCacheRule,
  ...pageRules,
  ...contentTypes.map(({ path, type }) => ({ path, headers: [{ key: "Content-Type", value: type }] })),
];
// Workers static assets accept at most 100 rules and 2,000 characters per line.
// https://developers.cloudflare.com/workers/static-assets/headers/
const body = headersFile(rules);
if (rules.length > 100) throw new Error(`export-static: ${rules.length} _headers rules exceed the limit of 100`);
const longLine = body.split("\n").find((line) => line.length > 2000);
if (longLine) throw new Error(`export-static: _headers line over 2,000 characters: ${longLine.slice(0, 80)}…`);
writeFileSync(join(pub, "_headers"), body);
console.log(
  `export-static: index.html, icon.svg, opengraph-image, sitemap.xml, robots.txt, ${eyecatches.length} eyecatches, ` +
    `blog (${articles.length} articles, ${ogImages.length} OG images, feed.xml, index.json), _headers`
);
