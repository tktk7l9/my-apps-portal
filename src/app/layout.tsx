import type { Metadata } from "next";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import "./globals.css";

const stats = computePortfolioStats(rawProjects);

const title = "齋藤拓也 — ポートフォリオ";
const description = `フロントエンドエンジニア（業務委託）齋藤拓也の個人開発ポートフォリオ。React・Next.js を中心に ${stats.totalProjects} 作品を企画から運用まで一人で手がけました。`;
const url = "https://my-apps-portal.saitotakuya0719.workers.dev";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(url),
  authors: [{ name: "tktk7l9" }],
  openGraph: {
    title,
    description,
    url,
    siteName: "齋藤拓也 ポートフォリオ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        {/* Cloudflare Web Analytics（トークンは公開前提の識別子。秘密ではない） */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts --
            type="module" のスクリプトは仕様上 defer されるため、パーサーを止めない */}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={'{"token": "cd156fbf0fd24da0a12e58fdb4e63828"}'}
        />
      </body>
    </html>
  );
}
