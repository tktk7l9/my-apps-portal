---
title: 自分のアプリを自分で計測するポートフォリオの作り方
date: 2026-10-06
summary: このポートフォリオ自体の設計。npm registry・OSV・GitHub API から各アプリの状態を集め、ビルド時に静的化して Workers の CPU 上限を避けるまでの経緯と、セキュリティ列とバッジの意味の違い。
tags: [my-apps-portal, cloudflare-workers, nextjs, security]
apps: [my-apps-portal]
sources:
  - https://github.com/tktk7l9/my-apps-portal
  - https://github.com/tktk7l9/my-apps-portal/blob/main/README.md
  - https://github.com/tktk7l9/my-apps-portal/blob/main/AGENTS.md
---

このサイトは個人開発したアプリの一覧ですが、「作品を並べる」だけでなく「各アプリの状態を自動で計測して載せる」ことを目的に作っています。このブログの最初の記事として、ポートフォリオ自身の作りを書いておきます。

## 何を自動で集めているか

アプリの定義は `src/lib/projects/data.ts` に集約していて、それぞれに `trackedPackages`（監視する npm パッケージ）と GitHub の URL を持たせています。ビルド時に Next.js の Server Components が次の 3 つを取りに行きます。

| データ | 取得元 | 用途 |
|---|---|---|
| 最新バージョン | npm registry | 各アプリの依存が outdated かどうか |
| 脆弱性 | OSV API | 依存の宣言レンジに既知の CVE があるか |
| 最終コミット日 | GitHub API | public リポジトリの更新状況 |

一方で Lighthouse・Mozilla Observatory・テスト件数・`npm audit` の結果は、計測のたびに手で `data.ts` に書き写しています。こちらは「計測日」を必ず添えて、古い数字が新しい数字に見えないようにしています。

## なぜトップページを静的ファイルにしたか

本番は Cloudflare Workers（`@opennextjs/cloudflare`）です。当初はリクエストごとに上の 3 つを取得してレンダリングしていましたが、無料プランの CPU 上限を超える 1102 エラーが出るようになりました。2026-10-06 の PR #55 で、`/`・`/icon.svg`・`/opengraph-image`・`/api/og/<id>.png` を `next build` で事前生成し、`scripts/export-static.mjs` が `public/` にコピーして Workers の静的アセットとして配る形にしました。静的アセットは Worker を起動せずに返るので、CPU 時間を消費しません。

代わりにデータの鮮度はビルド時点になります。そこで GitHub Actions の `rebuild.yml` が 3 時間ごとに Workers Builds の Deploy Hook を叩き、再ビルドしています。画面右上の「取得 <日時>」はこの事情を伝えるためのもので、更新ボタンは置いていません（SHIG 55）。

セキュリティヘッダーは `src/lib/security-headers.ts` を正本にして、Worker が返す応答（`next.config.ts` の `headers()`）と静的アセット（`public/_headers`）の両方に同じ値を書き出しています。片方だけ直すと食い違うためです。

## セキュリティ列とバッジは別物

一覧の「Security」列とバッジは、同じ「脆弱性」を指しているように見えて計算が違います。

- **Security 列**: 各リポジトリで `npm audit --omit=dev` を手動実行した結果。本番依存だけを対象にし、`score = 100 - 25×critical - 10×high - 3×moderate - 1×low` で算出。開発依存だけの勧告は `notes` に書く
- **バッジ**: `trackedPackages` の宣言レンジを OSV にライブ照会した結果。宣言の下限バージョンで判定するため、実際にインストールされている版より古く見えることがある（既知の限界）

CI 側では、素の `npm audit` の代わりに `scripts/audit-gate.mjs` を回しています。`audit-allowlist.json` にない勧告があれば失敗し、例外には理由と期限（約 1 か月先）が要ります。例外に修正版が出た場合も失敗にして、放置できないようにしています。

## 詳細モーダルと URL

カードを開くと詳細モーダルが出ますが、その状態は `?work=<id>` としてURLに載せています。ブラウザの戻るで閉じられ、特定の作品を共有できるためです（SHIG 59・60・82）。このブログの記事からも同じ URL でアプリの詳細へ飛べるようにしました。

## 参考

- [tktk7l9/my-apps-portal](https://github.com/tktk7l9/my-apps-portal) — README と AGENTS.md（静的化の経緯、audit gate の仕様）
- PR #55「トップページとアイキャッチ画像を静的アセットで配信し、Workers の CPU 上限超過(1102)をなくす」
- PR #46「npm audit を例外リストつきのゲートに置き換える」
