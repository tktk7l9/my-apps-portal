---
title: 更新ダイジェスト 2026 年 10 月中旬
date: 2026-10-13
updated: 2026-10-14
summary: 2026-10-11〜14 に全リポジトリへ入った変更のまとめ。Next.js 7 本の nonce CSP とページのキャッシュ、chronoscroll の特集 64 本と監査と表示の高速化、CSS Atelier の当たり判定、Service Anatomy の期限つきの記述、学習アプリと技の追加。
tags: [digest, changelog]
apps: [chronoscroll, service-anatomy, css-atelier, glsl-atelier, ai-primer, tricking-3d, acro-finder, lumen-bloom, ai-news-feed-app, my-apps-portal]
sources:
  - https://github.com/tktk7l9?tab=repositories
  - https://github.com/tktk7l9/service-anatomy/pull/128
  - https://github.com/tktk7l9/chronoscroll/pull/72
  - https://github.com/tktk7l9/tricking-3d/pull/45
  - https://github.com/tktk7l9/chronoscroll/pull/89
---

10/11〜14 の変更をまとめます。それより前は[9 月下旬〜10 月上旬のダイジェスト](/blog/digest-2026-10)にあります。PR 番号は各リポジトリのものです。

## 10 月 11 日

- **CSP**: Next.js 7 本を Worker の nonce にし、Observatory は 7 本とも A+ 125 に（[nonce の記事](/blog/nonce-csp-seven-nextjs-apps)）
- **キャッシュ**: そのうち 6 本が事前生成したページを毎回描き直していたのを直した（[キャッシュの記事](/blog/opennext-incremental-cache-1102)）
- **chronoscroll**: 要約の残骸を直し、イベントでない 2 件を除いた（[残骸の記事](/blog/chronoscroll-residue-and-suppress)）
- **tricking-3d**: 59 技・妥当性テスト・カメラ追従（[tricking-3d の記事](/blog/tricking-3d-plausibility-and-camera)）

コンテンツは 10/11 の終わりの時点で、Service Anatomy が記事 109 本・比較解剖 32 本（本番の RSS が空だったのも #128 で直した）、acro-finder が施設 231 件、chronoscroll が特集 48 本、CSS Atelier が 58 トラック 161 レッスン、GLSL Atelier が 31 トラック 114 レッスン、Snippet Sprint が 32 言語 621 問、AI Primer が 15 トラック 88 レッスンでした。

## 10 月 13 日

- **chronoscroll**: 特集を 48 本から 64 本に（#73・#75・#77・#79）。初期に作った特集 32 本を主題の記事と照らして見直し、968 件を確認して 128 件を直し、26 件を外した（#81〜#88、[監査の記事](/blog/chronoscroll-collection-audit)）。ビーコンを実行時の読み込みに変え、Observatory は A+ 130（12/12）に（#72）
- **CSS Atelier**: 87 トラック 248 レッスン。重なり順を当たり判定で採点する hitTarget と、WebGL が使えない端末への対応（[CSS Atelier の記事](/blog/css-atelier-hit-test-and-no-webgl)）
- **Service Anatomy**: 記事 121 本・比較解剖 36 本。期限のある記述を expires に登録して一覧にする仕組み（[期限の記事](/blog/service-anatomy-expiring-claims)）
- **tricking-3d**: 163 技。技ごとの「先に覚える技」と「次に挑戦できる技」の表示（#45）と、接地した手足の滑り・終わりの姿勢・踏切前の回転を検査するテスト（#35・#40・#51）
- **ほか**: GLSL Atelier が 49 トラック 168 レッスン、AI Primer が 24 トラック 142 レッスン、acro-finder は施設 2 件を外して 229 件（#82）、lumen-bloom はヒヤシンス・クチナシ・小菊を実物の花の構造で描き直した（#31）

## 10 月 14 日

- **chronoscroll**: JS と CSS を 1 本ずつにまとめ、JS の preload を低優先度に、計測ビーコンを読み込みの後に回した（#89）。本番は HTTP/3 で、Lighthouse のシミュレーションは HTTP/2 以外を多重化しないため、リクエストの本数がシミュレーション上の表示の遅れに出ていた。年表 `/` のモバイル Lighthouse（5 回の中央値）は 10/13 の 91 から 94 に。Cloudflare が近いデータセンターに振った回は 97〜99、往復約 110 ms の遠い経路の回は 93〜94 で、経路によって変わる。README の件数をデータと照らすテストも足した（#90）
- **このポートフォリオ**: AI ニュースダイジェストのテスト数を載せた（vitest の UI テスト 66 件と、Node の test runner で動く lib のテスト 126 件）

## 数字で見る

ポートフォリオの一覧の集計（2026-10-14）では、テスト件数の合計は 17,914 件、Lighthouse Performance を計測した 19 本の平均は 96.5 で、19 本とも 90 以上です。

## 参考

- 各リポジトリの `git log --since=2026-10-11` と、PR 番号で参照したマージ済み PR
- 10/11: 各記事の参考と、[service-anatomy PR #128](https://github.com/tktk7l9/service-anatomy/pull/128)（RSS の修正）
- 10/13: 各記事の参考と、[chronoscroll PR #72](https://github.com/tktk7l9/chronoscroll/pull/72)（ビーコン）・[#79](https://github.com/tktk7l9/chronoscroll/pull/79)（特集の追加の最後）、[tricking-3d PR #45](https://github.com/tktk7l9/tricking-3d/pull/45)・[#35](https://github.com/tktk7l9/tricking-3d/pull/35)・[#40](https://github.com/tktk7l9/tricking-3d/pull/40)・[#51](https://github.com/tktk7l9/tricking-3d/pull/51)、[acro-finder PR #82](https://github.com/tktk7l9/acro-finder/pull/82)、[lumen-bloom PR #31](https://github.com/tktk7l9/lumen-bloom/pull/31)
- 10/14: [chronoscroll PR #89](https://github.com/tktk7l9/chronoscroll/pull/89)（JS と CSS を 1 本に）・[#90](https://github.com/tktk7l9/chronoscroll/pull/90)（README の件数の照合）
