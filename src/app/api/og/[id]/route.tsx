import { ImageResponse } from "next/og";
import { rawProjects } from "@/lib/projects";

// Web を持たないアプリ（ネイティブ/CLI）用のアイキャッチ生成。
// project データから作るので、highlight や技術を更新すれば画像も追随する。
// ポータル本体の opengraph-image.tsx と同じ配色トークンを使う。

const BG = "#080c14";
const ACCENT = "#7dd3fc";
const TEXT = "#f1f5f9";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = rawProjects.find((candidate) => candidate.id === id);
  if (!project) return new Response(null, { status: 404 });

  const tech = (project.staticTech ?? []).map((entry) => entry.name).slice(0, 4);
  const metrics: string[] = [];
  if (project.testCoverage) {
    metrics.push(`${project.testCoverage.tests} TESTS`);
    metrics.push(`LINES ${project.testCoverage.lines}%`);
  }
  if (project.securityScores) {
    metrics.push(`SECURITY ${project.securityScores.score}`);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
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
          {/* platform "other" は「その他」以上の情報が無いのでカテゴリだけ出す */}
          {project.platform === "other"
            ? project.category.toUpperCase()
            : `${project.category.toUpperCase()} · ${project.platform.toUpperCase()}`}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "96px",
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {project.name}
          </div>
          {project.highlight && (
            <div
              style={{
                display: "flex",
                fontSize: "30px",
                color: "rgba(241,245,249,0.62)",
                lineHeight: 1.5,
                maxWidth: "1000px",
              }}
            >
              {project.highlight}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            {tech.map((name) => (
              <div
                key={name}
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
                {name}
              </div>
            ))}
          </div>
          {metrics.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "28px",
                fontSize: "20px",
                letterSpacing: "0.08em",
                color: "rgba(241,245,249,0.42)",
                fontFamily: "monospace",
              }}
            >
              {metrics.map((metric) => (
                <div key={metric} style={{ display: "flex" }}>
                  {metric}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      // /api/ogp と同じ 24 時間キャッシュ。毎リクエストの再生成を避ける
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    }
  );
}
