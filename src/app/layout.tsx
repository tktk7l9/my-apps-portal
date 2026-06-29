import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const title = "tktk7l9 — Apps";
const description = "個人で作成したWebアプリの一覧。ゲーム・シミュレーター・ツールなど全 11 プロジェクト。";
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
    siteName: "tktk7l9 Apps",
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
