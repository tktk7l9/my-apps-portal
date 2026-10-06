import { ImageResponse } from "next/og";
import { listSlugs, readPost } from "@/lib/blog/load";
import { formatDateJa } from "@/lib/blog/post";
import { rawProjects } from "@/lib/projects";

// Article OG image, same palette as the portal's opengraph-image.tsx and /api/og/[id].
// Prerendered for every slug at build time; scripts/export-static.mjs copies the PNGs into
// public/ so they are served as static assets (ImageResponse is too heavy for the free plan).

const BG = "#080c14";
const ACCENT = "#7dd3fc";
const TEXT = "#f1f5f9";

export const alt = "記事のアイキャッチ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return listSlugs().map((slug) => ({ slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = readPost(slug);
  const apps = post.apps
    .map((id) => rawProjects.find((p) => p.id === id)?.name)
    .filter((name): name is string => name !== undefined)
    .slice(0, 3);
  const titleSize = post.title.length > 28 ? 56 : 68;
  // Tags that merely repeat an app id would duplicate the app chips.
  const tags = post.tags.filter((tag) => !post.apps.includes(tag));
  const chips = [...apps, ...tags.slice(0, Math.max(0, 4 - apps.length)).map((t) => `#${t}`)];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `radial-gradient(ellipse at 78% 12%, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0) 58%), ${BG}`,
          color: TEXT,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "24px",
            letterSpacing: "0.16em",
            color: ACCENT,
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #38bdf8, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800,
              color: BG,
            }}
          >
            t
          </div>
          BLOG · {formatDateJa(post.date)}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: `${titleSize}px`,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: "-1px",
            maxWidth: "1040px",
          }}
        >
          {post.title}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  padding: "12px 26px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(125,211,252,0.32)",
                  color: ACCENT,
                  fontSize: "22px",
                  letterSpacing: "0.06em",
                }}
              >
                {chip}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: "20px", letterSpacing: "0.08em", color: "rgba(241,245,249,0.42)", fontFamily: "monospace" }}>
            MY-APPS-PORTAL.SAITOTAKUYA0719.WORKERS.DEV/BLOG
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
