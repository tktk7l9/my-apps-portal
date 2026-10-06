---
title: 学習アプリ3本の共通設計 — 厳格な CSP のまま学習者のコードを実行する
date: 2026-10-06
summary: CSS Atelier は constructable stylesheet、GLSL Atelier は readPixels と不透明オリジンの sandbox iframe、AI Primer はビルド時の Markdown 変換。「解説→記述→自動採点」を unsafe-inline なしで成立させた方法。
tags: [css-atelier, glsl-atelier, ai-primer, csp, security, learning-apps]
apps: [css-atelier, glsl-atelier, ai-primer]
sources:
  - https://github.com/tktk7l9/css-atelier
  - https://github.com/tktk7l9/glsl-atelier
  - https://github.com/tktk7l9/ai-primer
---

2026 年 6〜7 月に、同じ骨格の学習アプリを 3 本作りました。CSS Atelier（15 トラック 37 レッスン）、GLSL Atelier（14 トラック 31 レッスン）、AI Primer（8 トラック約 40 レッスン）です。共通しているのは「解説→コードを書く→自動採点」の流れと、採点を `src/engine` の純関数に閉じ込めて 100% のカバレッジゲートを掛けている点です。

一番悩んだのは「学習者が書いた任意のコードをその場で動かしたいが、サイトの CSP は緩めたくない」という矛盾でした。3 本で答えが違うので並べて書きます。

## CSS Atelier: constructable stylesheet で注入する

学習者の CSS を `<style>` に書き込むと、`style-src 'self'` の CSP に止められます。CSS Atelier では同一オリジンの `<iframe srcdoc>` を用意し、iframe 自身の realm の `CSSStyleSheet` を作って `document.adoptedStyleSheets = [base, user]` で当てています。入力のたびに `userSheet.replaceSync(css)` を呼ぶだけで、CSP は `style-src 'self'` のままです。

iframe なので `body` や `@media`、`@container` が実ビューポートに対して正しく動き、同一オリジンなので `getComputedStyle` と `getBoundingClientRect` を読んで採点できます。無効な CSS（`@import` など）は例外を捕まえて直前の有効なルールを維持します。sandbox 属性は `allow-same-origin` だけで、スクリプトは動きません。

採点は「どう書いたか」ではなく表示結果で判定し、メディア/コンテナクエリの課題は複数のビューポート幅で評価する「二状態バリデーション」にしています。無条件に書いただけでは通りません。

## GLSL Atelier: シェーダーは直接、Three.js は隔離

GLSL は GPU 専用の言語で任意の JS を実行しないので、メインページで直接コンパイルして固定サイズ・固定時刻でオフスクリーン描画し、`gl.readPixels` でピクセルを読み戻して採点しています。`eval` も `unsafe-inline` も要りません。

Three.js のレッスンは学習者が任意の JS を書くので、`sandbox="allow-scripts"` の不透明オリジン iframe に隔離しました（`allow-same-origin` は付けない）。親の DOM・Cookie・localStorage には触れず、`postMessage` でコードを渡してシーングラフのスナップショットを読み戻します。無限ループ対策として 5 秒でタイムアウトし、iframe を作り直します。

緩和した CSP は `/sandbox.html` だけに限定しています。不透明オリジンからは `'self'` の `/assets` が読めないため、Vite プラグインで Three.js 込みの単一バンドルを `<script>` にインライン化した自己完結の HTML を生成しています。`public/_headers` では、Workers の `html_handling` が `/sandbox.html` を `/sandbox` に 307 するので両方のパスに同じ緩和ヘッダーを書き、`! Content-Security-Policy` で `/*` の値を明示的に除去してから再設定しています。複数ルールが一致すると値がカンマ連結されて CSP が 2 つになり、ブラウザが積集合を取ってサンドボックスが壊れるためです。

## AI Primer: 実行ではなく変換

AI Primer は「仕組みと使い方」を学ぶ教材なので、コードを実行する代わりにクイズで確認します。クイズは `single / multi / boolean / order` の判別共用体で、評価は純関数の `evaluate(spec, answer)` です。本文は 1 レッスン 1 ファイルの純データで、Markdown は remark/rehype でビルド時に HTML 化し、クライアント JS を最小にしています。

CSP は 2026-09-12 に per-request nonce から静的ヘッダーへ移しました。Service Anatomy と同じ理由で、Next 16 の proxy が Node 専用のため OpenNext（Cloudflare Workers）へ持っていけなかったからです。代わりに `csp.test.ts` が `'strict-dynamic'` の混入を止めています。CSP Level 3 では `'strict-dynamic'` が `'self'` と `'unsafe-inline'` を無効化するため、nonce なしで付けると全スクリプトが止まります。

鮮度は別の仕組みで守っています。月次の GitHub Actions が全レッスンの出典 URL の死活と `lastVerified` の 90 日超過を調べ、Issue を作ります。本文の自動更新はしません。`fetch()` が Britannica や OpenAI などでボット判定の 403 を返し、実ブラウザでは 200 だった例が複数あったので、目視確認を前提にしています。

## 3 本に共通する結果

| | CSP (script-src) | Observatory | テスト |
|---|---|---|---|
| CSS Atelier | `'self'`（unsafe-inline なし） | A+ 120 | 323 |
| GLSL Atelier | `'self'`（/sandbox.html のみ緩和） | A+ 120 | 299 |
| AI Primer | `'self' 'unsafe-inline'` | B 75 | 544 |

数値は 2026-10-05 の計測です。AI Primer だけ Observatory が B なのは、Next のブートストラップがインラインスクリプトである以上 `'unsafe-inline'` が要るためで、Vite 製の 2 本との構造的な差です。

## 参考

- [tktk7l9/css-atelier](https://github.com/tktk7l9/css-atelier) — README「仕組み（設計のキモ）」、`src/sandbox/sandbox.ts`
- [tktk7l9/glsl-atelier](https://github.com/tktk7l9/glsl-atelier) — README「設計の鍵」、`public/_headers`、`src/sandbox/scene-sandbox.ts`
- [tktk7l9/ai-primer](https://github.com/tktk7l9/ai-primer) — `docs/refresh-runbook.md`、`src/lib/csp.ts`
