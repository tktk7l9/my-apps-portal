---
title: Lighthouse 100×4 と Observatory A+ を複数アプリで取るための定石
date: 2026-10-06
summary: 複数のアプリで繰り返し効いた手順。Three.js の動的 import、インライン polyfill の無効化、Next のフォント方針、CSP から unsafe-inline を外すこと、ビーコンに SRI を付けない理由、中央値判定の CI ガード。
tags: [lighthouse, observatory, performance, csp, security]
apps: [hyper-tetris, tricking-3d, snippet-sprint, skydial, css-atelier, service-anatomy]
sources:
  - https://github.com/tktk7l9/hyper-tetris
  - https://github.com/tktk7l9/tricking-3d
  - https://github.com/tktk7l9/snippet-sprint
  - https://github.com/tktk7l9/service-anatomy
  - https://github.com/tktk7l9/my-apps-portal/blob/main/src/lib/projects/data.ts
---

ポートフォリオに載せているアプリの Lighthouse と Mozilla Observatory は、計測日つきで `data.ts` に記録しています。2026-09-30 の計測では公開 19 本のうち hyper-tetris・tricking-3d・snippet-sprint がモバイルで 100/100/100/100、Observatory A+ は lumen-bloom・skydial・snippet-sprint・css-atelier・glsl-atelier・hyper-tetris・tricking-3d・chronoscroll・somewhere-now です。繰り返し効いた手順を並べます。

## Performance: 最初の JS を小さくする

バニラ Vite + Three.js のアプリは、Three.js を初期バンドルから外すだけでモバイルの Performance が大きく動きます。

- hyper-tetris: `src/boot.ts` が `await import("./main.js")` するだけの構成にして、エントリ 600KB → 2.2KB、TBT 410ms → 0ms、Performance 82 → 100
- tricking-3d: 683KB の解析本体を `src/app-main.ts` に分離し、`src/main.ts` は 2.5KB のタイトル画面。スタート画面の HTML/CSS は `index.html` にインライン化
- snippet-sprint: ゲーム本体を初回のポインタ/キー入力で読み込む。アイドル時に先読みしたところ Three.js がコールドロードの計測に入ってしまい、逆に下がったのでやめた。スタート画面のピルを HTML に事前描画して CLS 0.125 → 0

Next.js アプリは 98〜99 が天井で、100 は構造的に難しいと感じています。service-anatomy では日本語 Web フォントの `@font-face` 群だけで約 190KB の CSS がレンダーブロッキングになり Performance が 72 まで落ちたので、日本語はシステムフォントに戻して 95 まで回復しました。欧文だけ `next/font` で `display: "optional"` にしています。`swap` だと h1 の LCP がフォント到着の再描画に引きずられ、CI の判定が不安定になりました。

## Accessibility / Best Practices / SEO の小さな項目

100 に届かない残りは、たいてい次のどれかでした。

- viewport の `user-scalable=no` や `maximum-scale`（Accessibility）
- favicon の 404（Best Practices）。`data:` の SVG で解決
- `robots.txt` がない（SEO）
- 補足文のコントラスト不足。このポートフォリオでは slate-500 がダーク背景で 3.3〜4.1:1 しかなく、`--color-muted: #8091a9` を定義して 4.8:1 以上にした

2026-09-29〜10-01 には全リポジトリで axe の違反をゼロにする一括点検もしました（css-atelier 819 → 0、lifeplan-simulator 494 → 0、hyper-tetris 85 → 0 など）。

## Observatory: unsafe-inline を外せるかどうか

Observatory v2 の 12 項目で差がつくのは CSP です。`script-src` から `'unsafe-inline'` を外せると A+（115〜120）、外せないと -20 で B 前後になります。

Vite アプリでは `build.modulePreload.polyfill: false` が鍵でした。これがないとインラインの polyfill スクリプトが入り、`'unsafe-inline'` が要ります。インラインの `<style>` も外部 CSS に移します。hyper-tetris と tricking-3d はこの手順で B+ から A+ になりました。

Next.js アプリはブートストラップ（`self.__next_f.push`）がインラインなので `'unsafe-inline'` が外せず、nonce 方式も OpenNext では使えません。service-anatomy・ai-primer・acro-finder・このポートフォリオが B（75）なのはそのためで、失点は CSP -20 と SRI -5 の 2 項目だけです。

SRI の -5 は意図的に受け入れています。Cloudflare Web Analytics の `beacon.min.js` はバージョンのない URL を Cloudflare 側が差し替える運用なので、`integrity` を固定するとビーコンだけ黙って止まります。

## CI で守る

service-anatomy と ai-primer の CI には Lighthouse の回帰ガードがあります。`npm start` で本番ビルドを起動し、3 回計測した中央値で判定します（閾値 Performance 80 / Accessibility 95 / Best Practices 90 / SEO 95）。共有ランナーでは同一コードで 94 → 72 まで振れたことがあり、単発の計測では判定になりませんでした。

一覧の数値を更新するときは `median-of-3` で測り、`measuredAt` を必ず添えています。古い数値が今の数値のように見えるのが、この種のページでいちばん避けたいことです。

## 参考

- hyper-tetris commit 8c961b5、tricking-3d commit 3cb6af8、snippet-sprint commit c6ec427・b8143c9（動的 import と CLS の記録）
- service-anatomy `scripts/lighthouse-ci.mjs`、`src/app/layout.tsx` のフォントコメント
- [my-apps-portal `data.ts`](https://github.com/tktk7l9/my-apps-portal/blob/main/src/lib/projects/data.ts) — 各アプリの `lighthouseScores` / `securityHeaders`（計測日つき）
