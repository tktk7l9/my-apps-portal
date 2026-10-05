import type { Metadata } from "next";
import { headers } from "next/headers";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import "./globals.css";

const stats = computePortfolioStats(rawProjects);

const title = "齋藤拓也 — ポートフォリオ";
const description = `フルスタックエンジニア（業務委託）齋藤拓也の個人開発ポートフォリオ。React・Next.js を軸に、API・データベース・デプロイまで ${stats.totalProjects} 作品を一人で手がけました。`;
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading the request headers makes every page render per request, which the nonce CSP needs.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        {/* Cloudflare Web Analytics (the token is an identifier meant to be public, not a secret).
            gitleaks flags a 32-digit hex as generic-api-key, so gitleaks:allow on the
            flagged line suppresses it. A .gitleaks.toml would also work, but it replaces
            the whole default ruleset, which leaves room to hide real secrets too. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts --
            type="module" scripts are deferred by spec, so this does not block the parser */}
        <script
          type="module"
          nonce={nonce}
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={'{"token": "cd156fbf0fd24da0a12e58fdb4e63828"}' /* gitleaks:allow */}
        />
      </body>
    </html>
  );
}
