// Copies build output that Next.js prerendered into public/, so OpenNext ships it as Workers
// static assets. Static assets are served without running the Worker, which keeps "/" and the
// generated eyecatch images off the free plan's per-request CPU limit (error 1102).
//
//   npm run build  →  prebuild: --clean  →  next build  →  this script
//
// OpenNext runs `npm run build` and then copies public/ into .open-next/assets.
// Everything written here is listed in .gitignore and removed again by --clean, because
// Next.js refuses to build when a public file shadows a route.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Node 24 strips types when importing a .ts module, so the header list stays in one place.
import { headersFile, securityHeaders } from "../src/lib/security-headers.ts";

const root = join(import.meta.dirname, "..");
const app = join(root, ".next/server/app");
const pub = join(root, "public");

const GENERATED = ["index.html", "icon.svg", "opengraph-image", "api", "_headers"];

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
const eyecatches = readdirSync(join(app, "api/og")).filter((name) => name.endsWith(".png.body"));
if (eyecatches.length === 0) throw new Error("export-static: no prerendered /api/og images");
for (const name of eyecatches) copy(`api/og/${name}`, `api/og/${name.replace(/\.body$/, "")}`);

const headers = securityHeaders(false);
writeFileSync(
  join(pub, "_headers"),
  headersFile([
    { path: "/*", headers },
    { path: "/opengraph-image", headers: [{ key: "Content-Type", value: "image/png" }] },
  ])
);
console.log(`export-static: index.html, icon.svg, opengraph-image, ${eyecatches.length} eyecatches, _headers`);
