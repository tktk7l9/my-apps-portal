import type { Metadata } from "next";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const stats = computePortfolioStats(rawProjects);

const title = "齋藤拓也 — ポートフォリオ";
const description = `フルスタックエンジニア（業務委託）齋藤拓也の個人開発ポートフォリオ。React・Next.js を軸に、API・データベース・デプロイまで ${stats.totalProjects} 作品を一人で手がけました。`;
const url = SITE_URL;

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(url),
  authors: [{ name: "tktk7l9" }],
  openGraph: {
    title,
    description,
    url,
    siteName: SITE_NAME,
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
        <Analytics />
      </body>
    </html>
  );
}
