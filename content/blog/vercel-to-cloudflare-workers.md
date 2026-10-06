---
title: Vercel から Cloudflare Workers へ公開アプリをまとめて移した記録
date: 2026-10-06
summary: 2026-08-11 の Vercel 停止から始まった移行の定型手順と、_headers のカンマ連結・html_handling の 307・OpenNext の Cron ラッパー・nonce CSP・esbuild 未宣言・SITE_URL の localhost 化といった罠。
tags: [cloudflare-workers, vercel, migration, opennext, vite]
apps: [lumen-bloom, skydial, snippet-sprint, resume, acro-finder, ai-news-feed-app, chronoscroll]
sources:
  - https://github.com/tktk7l9/lumen-bloom
  - https://github.com/tktk7l9/resume/pull/33
  - https://github.com/tktk7l9/acro-finder
  - https://github.com/tktk7l9/ai-news-feed-app/pull/22
  - https://github.com/tktk7l9/glsl-atelier
---

2026-08-11、Vercel の無料枠を超えてアカウントが停止し、公開していた全プロジェクトが `402 DEPLOYMENT_DISABLED` を返すようになりました。lumen-bloom の移行コミットに残した数字は「Fast Origin Transfer 30.01GB/10GB = 300%、Edge Requests 1.7M/1M = 170%」です。その日のうちに静的な Vite アプリ 5 本を Cloudflare Workers へ移し、8 月 16 日に Next.js アプリ、9 月に nonce CSP を持つ 3 本、9 月 27 日に chronoscroll と続きました。

## 静的 Vite アプリの定型

静的アプリは Worker スクリプトなしの「assets だけ」の構成です。`wrangler.jsonc` は `assets.directory: "./dist"` と `not_found_handling: "404-page"`（Vercel 時代もリライトなしで未知パスは 404 だったので揃える）、`observability.enabled: true`、`compatibility_date` の 4 項目です。`html_handling` は既定のままにしています。

ヘッダーは `vercel.json` の `headers` を `public/_headers` に移植します。`/*` に CSP・`X-Frame-Options`・`Referrer-Policy`・`Permissions-Policy`・HSTS、`/assets/*` に `Cache-Control: public, max-age=31536000, immutable` を書きます。Vercel が自動で付けていた immutable を明示するためです。

移行の後処理は 2 回に分けました。9 月 4 日に Vercel Analytics を Cloudflare Web Analytics のビーコンに置き換え（CSP の `script-src` に `static.cloudflareinsights.com`、`connect-src` に `cloudflareinsights.com` を追加）、9 月 7 日に `vercel.json` を削除しました。それまでは「Vercel が復活したら両方にデプロイできる」よう残していました。

## _headers の罠

glsl-atelier だけ、`/sandbox.html` に緩和した CSP を当てる必要がありました。`vercel.json` では負の先読みで除外していましたが、`_headers` にその構文はありません。複数ルールが一致すると値がカンマ連結され、CSP が 2 つになってブラウザが積集合を取り、サンドボックスが壊れます。`! Content-Security-Policy` で先のルールの値を除去してから再設定して解決しました。

もう 1 つ、Workers の `html_handling` は `/sandbox.html` を `/sandbox` に 307 します。`"none"` にすれば 307 は消えますが、`/` が `index.html` に解決されなくなってトップが 404 になることを検証で確認したので、既定のまま両方のパスに同じヘッダーを書いています。

## Next.js アプリと OpenNext

Next.js アプリは `@opennextjs/cloudflare` で、`main: ".open-next/worker.js"`・`compatibility_flags: ["nodejs_compat"]`・`assets.binding: "ASSETS"` が必要です。`open-next.config.ts` は `defineCloudflareConfig()` の既定で始めました。

- **Cron**: OpenNext が生成する `worker.js` は `fetch` しか持ちません。ai-news-feed-app では薄いラッパーの `worker.js` を `main` にして `scheduled` を足し、`Authorization: Bearer <CRON_SECRET>` を付けた内部 Request を OpenNext の fetch ハンドラへ `ctx.waitUntil` で渡しています。`CRON_PATHS` と `wrangler.jsonc` の `triggers.crons` を同期させるのが約束です
- **nonce CSP**: Next 16 の proxy は Node ランタイム専用で、OpenNext は Node middleware に対応していません。per-request nonce を発行していた service-anatomy・ai-primer・acro-finder の 3 本は、nonce を捨てて静的ヘッダーに移してから移行しました
- **esbuild 未宣言**: OpenNext は esbuild を宣言せずに import しており、ホイスト頼みです。Dependabot がロックファイルを再生成してネストされると `npm ci` で消え、「テストは全部通るのにデプロイだけ `ERR_MODULE_NOT_FOUND`」になります。全リポジトリで esbuild を明示の devDependency にしました
- **SITE_URL**: acro-finder は `VERCEL_PROJECT_PRODUCTION_URL` から URL を組み立て、無ければ `http://localhost:3000` にしていました。Workers にその環境変数はないので、ビルドは通り画面も正常なのに canonical・sitemap・OGP・JSON-LD が localhost を指します。定数にして `site.test.ts` で固定しました
- **optimizeCss**: resume で `experimental.optimizeCss` を有効にしていると、OpenNext が `.next/static/css` を無条件にコピーしようとして ENOENT で落ちました（Next 16 の Turbopack は CSS を `static/chunks/` に出す）。効果もゼロだったので外しました

## 検証の仕方

`npm run preview`（`opennextjs-cloudflare preview`）で workerd 上の動作を確かめます。`next dev` では見えない差がここで出ます。`compatibility_date` は UTC で検証されるため、JST の「今日」を書くと `in the future` で失敗することがあります。移行後の確認は、トップの 200 ではなく sitemap から実 URL を拾って叩くことにしています。

## 参考

- lumen-bloom 移行コミット 1205320（2026-08-11）、`public/_headers`、`wrangler.jsonc`
- [resume PR #33](https://github.com/tktk7l9/resume/pull/33) — Next.js アプリ最初の移行、optimizeCss と pnpm override の記録
- [ai-news-feed-app PR #22](https://github.com/tktk7l9/ai-news-feed-app/pull/22) — Cron ラッパー `worker.js`
- acro-finder `lib/csp.ts`・`lib/site.ts`・migration commit 06fa7ec（2026-09-14）
- glsl-atelier `public/_headers` と `wrangler.jsonc` のコメント
