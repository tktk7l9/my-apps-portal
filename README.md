# my-apps-portal

[![Keyway Secrets](https://www.keyway.sh/badge.svg?repo=tktk7l9/my-apps-portal)](https://www.keyway.sh/vaults/tktk7l9/my-apps-portal)

個人で作成した Web アプリの一覧・管理ポータル。依存パッケージのバージョン状態や最終コミット日を自動取得し、アップデートが必要なアプリを一目で把握できる。

## Features

- **プロジェクト一覧** — カテゴリ・技術スタック・テキストでフィルタリング＆ソート
- **バージョン監視** — npm registry から最新バージョンを取得し、outdated / vulnerable を色分け表示
- **脆弱性チェック** — OSV API でパッケージの CVE を自動検出
- **最終コミット日** — GitHub API で public リポジトリの最終コミット日を表示
- **手動更新ボタン** — キャッシュを即座にクリアして最新情報を再取得
- **詳細モーダル** — アプリごとに OGP 画像・技術スタック・リンクをまとめて確認

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [TypeScript](https://www.typescriptlang.org)

## Data Sources

| データ | 取得元 | キャッシュ |
|--------|--------|-----------|
| 最新バージョン | npm registry | 1 時間 |
| 脆弱性情報 | [OSV API](https://osv.dev) | 1 時間 |
| 最終コミット日 | GitHub API | 1 時間 |
| OGP 画像 | 各アプリの `og:image` | 24 時間 |

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動します。

## Project Structure

```
src/
├── app/
│   ├── actions.ts          # revalidatePath Server Action
│   ├── api/ogp/route.ts    # OGP image proxy
│   └── page.tsx
├── components/
│   ├── ProjectTable.tsx        # メインテーブル（フィルタ・ソート）
│   ├── ProjectDetailModal.tsx  # 詳細モーダル
│   ├── ProjectTableSkeleton.tsx
│   └── RefreshButton.tsx
└── lib/
    ├── projects.ts         # アプリ定義データ
    ├── github.ts           # GitHub API クライアント
    └── version-status.ts   # npm / OSV バージョンチェック
```

依存パッケージの更新自体は各リポジトリの Dependabot（`.github/dependabot.yml`）に任せており、本ポータルは状態の可視化のみを担う。

## ホスティング

本番は **Cloudflare Workers**（`@opennextjs/cloudflare`）: https://my-apps-portal.saitotakuya0719.workers.dev

2026-08-11、Vercel 無料枠の超過でアカウントが停止（全プロジェクトが
`402 DEPLOYMENT_DISABLED`）したため移行した。Server Actions・API Route・
`next/og` を持つ動的アプリなので、静的アプリのような assets 配信ではなく
Worker スクリプト（`.open-next/worker.js`）が要る。`npm run deploy` で
build + deploy、`GITHUB_TOKEN` は Worker のシークレット（`wrangler secret put`）。

掲載データ側の対応:

- Cloudflare へ移した6本（skydial / css-atelier / glsl-atelier / lumen-bloom /
  snippet-sprint / 本ポータル）は `liveUrl` を workers.dev に更新
- **同一アカウントの workers.dev 宛は Worker からの subrequest が通らない**ため、
  `/api/ogp` でのスクレイプができない。各アプリの `ogp.png` を `public/og/` に
  置いて `ogImage` で直接指定している（service-anatomy と同じ回避策）
- 消費源として停止した3本（acro-finder / ai-primer / service-anatomy）は
  リンク切れを出さないよう `liveUrl` を外した（`公開中` の集計からも外れる）
