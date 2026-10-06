---
title: モバイル Lighthouse を 90 に届かせた 3 本の記録
date: 2026-10-07
summary: acro-finder・chronoscroll・service-anatomy のモバイル Performance を 2026-10-06 に 90 以上にした記録。和文フォントと HTML の削減、フェードインで遅れた LCP、/ のリダイレクト、そして版とばらつきの扱い。
tags: [lighthouse, performance, nextjs, sveltekit]
apps: [acro-finder, chronoscroll, service-anatomy]
sources:
  - https://github.com/tktk7l9/acro-finder/pull/67
  - https://github.com/tktk7l9/acro-finder/pull/70
  - https://github.com/tktk7l9/chronoscroll/pull/55
  - https://github.com/tktk7l9/service-anatomy/pull/118
  - https://github.com/tktk7l9/service-anatomy/pull/120
  - https://github.com/tktk7l9/my-apps-portal/pull/69
---

ポートフォリオに記録していたモバイルの Lighthouse Performance（2026-09-30）は、acro-finder 87、service-anatomy 88、chronoscroll 88 でした。2026-10-06 に 3 本とも 90 を超え、記録は acro-finder 94・service-anatomy 92・chronoscroll 93 になりました。

## 前提: モバイルの値はシミュレーション

Lighthouse は既定でシミュレーションのスロットリングを使います。いったん制限なしで読み込み、観測したデータから遅い回線での読み込みを計算します（Lantern）。acro-finder #70 で本番のトレースを見直してわかったのは、この計算では初回描画までに読み終えたリクエストがすべて LCP に入る、ということでした。3 本とも、最初の描画の前に読むものを減らす作業になりました。

## acro-finder: フォントと HTML

#67 は和文 Web フォント（Zen Kaku Gothic New）を外して OS のフォントにしました。3 ウェイトを unicode-range で分割した約 66 リクエスト・約 650KB と、`@font-face` だけで約 85KB の CSS です。描画をブロックする CSS は 98KB から 13KB（非圧縮）になり、本番の 3 回中央値は 85 → 91 になりました。リストの写真（先頭 6 枚で約 1.4MB）は `load` の後に回しています。

それでも 88〜91 を行き来したので、#70 で地図トップの HTML に載せるカードを先頭 20 件にしました。HTML は 171KB（圧縮 19KB）から 52KB（圧縮 11KB）になり、新しい接続が最初の往復で運べる約 14KB に収まります。欧文の Inter Tight は使う太さだけを自前でホストし、45KB → 29KB です。

失敗もありました。フォントのプリロードを 2 本ともやめると、ローカルの A/B で 95 → 89 に下がりました。CSS 経由で見つかったフォントは最優先で取得され、シミュレーションでは描画をブロックする扱いで FCP に入るためです。結局プリロードをやめたのは JetBrains Mono だけでした。スマホの初回表示では器具チップのアイコンにしか使っておらず、その字形はもともと Arial・ヒラギノ・Menlo が描いていたので、それらを直接指定しています。本番の 5 回中央値は 94 です。

## chronoscroll: フェードインが LCP を遅らせた

#54 は、最初のカードを描く前に `overview.json`（720KB / brotli 158KB）全体を待っていたのを、カードに要る項目だけの `overview-lite.json`（brotli 42KB）で描くようにしました。ローカルは 89 → 96 でしたが、本番は 88（LCP 3.70 s）のままでした。

トレースを見ると、最初のカードは描画直後に出ているのに、`card-in` アニメーションが opacity 0 から始まるため、LCP は約 260ms 後に記録されていました。その間に `overview.json`（163KB）などの取得が始まっていて、シミュレーションは LCP より前に始まったリクエストを LCP に計上します。ローカルでは `overview.json` の到着が遅かったので差が出ませんでした。#55 で最初の画面のカードはフェードさせず、残りの取得を描画の後（rAF 2 回 + 300ms）に回して、本番は 93 になりました。

## service-anatomy: SVG の桁数とリダイレクト

#118 で調べると、`/ja` の HTML が 1.1MB ありました。記事ごとのアイキャッチ SVG 95 枚（350KB）と、それを繰り返す RSC ペイロードが大半で、座標が `197.38096966873854` のような倍精度のまま出ていました。座標を整数に丸め、同じ線種の `<line>` を 1 本の `<path>` にまとめて、1.12MB → 0.68MB です。

本番の `/ja` は 91 になりましたが、ポートフォリオが測る `/` は 89 でした。`/` → `/ja` の 307 に、Lighthouse の redirects 監査が約 0.8 秒を計上していたためです。#120 で `/` は既定ロケールのトップを直接返す（canonical は `/ja`）ようにして、92 になりました。

## 測り方の約束

- 本番を 3 回測って中央値を記録する。acro-finder のように 88〜91 で揺れたときは 5 回測った。Lighthouse のドキュメントにも、5 回の中央値は 1 回の 2 倍安定するとあります
- ローカルの `opennextjs-cloudflare preview` は gzip をかけないので、本番より 10 ポイント前後低く出る。比べるのは差分だけにする
- 版を揃える。acro-finder を 12.8.2 で測ると Best Practices が 96 になりました。12.x にある `font-size` 監査（12px 未満の文字が 49%）のためで、13.x ではこの監査がなくなっています。記録は 13.5.0 で測っています

## 参考

- [acro-finder PR #67](https://github.com/tktk7l9/acro-finder/pull/67)（本番の結果はコメント）・[#70](https://github.com/tktk7l9/acro-finder/pull/70)（仮説ごとの A/B）
- [chronoscroll PR #54](https://github.com/tktk7l9/chronoscroll/pull/54)・[#55](https://github.com/tktk7l9/chronoscroll/pull/55)
- [service-anatomy PR #118](https://github.com/tktk7l9/service-anatomy/pull/118)・[#120](https://github.com/tktk7l9/service-anatomy/pull/120)
- [my-apps-portal PR #68](https://github.com/tktk7l9/my-apps-portal/pull/68)・[#69](https://github.com/tktk7l9/my-apps-portal/pull/69)・[#71](https://github.com/tktk7l9/my-apps-portal/pull/71)（12.x と 13.x の違い）・[#72](https://github.com/tktk7l9/my-apps-portal/pull/72)（5 回の計測）
- Lighthouse のドキュメント: [throttling.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md)・[variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
