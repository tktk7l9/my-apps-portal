import { ImageResponse } from "next/og";

export const alt = "tktk7l9 — Apps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background:
            "radial-gradient(ellipse at 78% 12%, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0) 58%), #080c14",
          color: "#f1f5f9",
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
            color: "#7dd3fc",
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
              color: "#080c14",
            }}
          >
            t
          </div>
          GITHUB.COM/TKTK7L9
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "138px",
              fontWeight: 800,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            My&nbsp;<span style={{ color: "#38bdf8" }}>Apps</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "rgba(241,245,249,0.62)",
              lineHeight: 1.5,
              maxWidth: "960px",
            }}
          >
            個人で作成したWebアプリの一覧 — ゲーム・シミュレーター・ツールなど。
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          {["GAMES", "SIMULATORS", "TOOLS", "3D / WEBGL"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: "9999px",
                border: "1px solid rgba(125,211,252,0.32)",
                color: "#7dd3fc",
                fontSize: "22px",
                letterSpacing: "0.06em",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
