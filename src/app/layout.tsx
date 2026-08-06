import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import "./globals.css";

const stats = computePortfolioStats(rawProjects);

const title = "齋藤拓也 — ポートフォリオ";
const description = `フロントエンドエンジニア（業務委託）齋藤拓也の個人開発ポートフォリオ。React・Next.js を中心に ${stats.totalProjects} 作品を企画から運用まで一人で手がけました。`;
const url = "https://my-apps-portal-tau.vercel.app";

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
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
