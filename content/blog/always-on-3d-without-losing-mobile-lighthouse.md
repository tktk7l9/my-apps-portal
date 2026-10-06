---
title: 常時 3D 描画でモバイルの Lighthouse を落とさない工夫
date: 2026-10-06
summary: Lumen Bloom のモバイル Performance 45 → 99 までにやったこと。適応フレームレート、影パスの動的停止、段階的な初期化と compileAsync、タブ非表示で全停止。Skydial・Snippet Sprint の遅延読込とあわせて。
tags: [threejs, performance, lighthouse, lumen-bloom, skydial]
apps: [lumen-bloom, skydial, snippet-sprint, hyper-tetris, tricking-3d]
sources:
  - https://github.com/tktk7l9/lumen-bloom
  - https://github.com/tktk7l9/skydial
  - https://github.com/tktk7l9/snippet-sprint
---

Three.js のアプリは 5 本あります。Hyper Tetris（4D〜6D のテトリス）、Tricking 3D Analyzer、Snippet Sprint（タイピングゲーム）、Skydial（太陽・月トラッカー）、Lumen Bloom（3D ウォールペーパー）です。どれも Vite + バニラ TypeScript で、フレームワークは使っていません。

このうち Lumen Bloom だけが「常時描画」です。置き時計のように一日中つけておく前提なので、ゲームのように「操作中だけ 60fps」という逃げ道がありません。モバイルの Lighthouse Performance が最初 45 だったところから 99 まで持っていった記録を中心に書きます。

## 最初の 45 が意味していたこと

初回の本番計測で、スロットリングされたモバイルでは「メインスレッドの処理が約 13 秒」でした。原因は 60fps の連続描画と、太陽と月の 2 つのシャドウパス（2048 と 1024 のシャドウマップ）です。描画が止まらないので TBT が積み上がり、6.3 秒になっていました。

## 適応フレームレート

フレームレートを状態で切り替えました。

- 雨雪のパーティクルが降っているか、稲光が待機しているときだけ 30fps
- 平常時（太陽がゆっくり動き、風が吹いているだけ）は 10fps
- 照明の遷移は 30fps のトリガーにしない。輝度や色のゆっくりしたランプは 10fps でも滑らか（commit 03d0626）

天気は Open-Meteo の WMO コードをムードに対応づけ、全照明量を指数スムージング（τ ≈ 2s）で遷移させているので、10fps でも段差は見えません。

## 影パスは光源と一緒に止める

シャドウパスは「光源が消えているときはパスごと止める」にしました。`sunRig.light.castShadow = sunIntensity > 0.01`、`moonRig.light.castShadow = moonIntensity > 0.005` です。昼は月のパスが、夜は太陽のパスと窓格子のゴボ板が丸ごと止まります。シャドウマップも 2048 → 1536、1024 → 768 に下げ、`pixelRatio` は `min(devicePixelRatio, 1.75)` で頭打ちにしました。

窓格子の影はカメラには映らない（`colorWrite` / `depthWrite` 無効）`alphaTest` のゴボ板が太陽方向に追従して、シャドウマップにだけ寄与する作りです。

## 段階的な初期化と事前コンパイル（PR #16）

2026-09-29 の PR #16 では初期化を分割しました。`src/main.ts` は `import("./orchestrator.js")` するだけの薄いブートストラップで、オーケストレーターがさらに `import("./scene/stage")` を別チャンクとして読みます。LCP 要素（花の説明テキスト）は 3D より先に描きます。`bootScene()` はレンダラー作成・PMREM の環境マップ・シーン組み立て・シェーダーの事前コンパイルを 1 タスクずつ `yieldToMain` で区切り、`compileAsync` で画面用・透過パス用・影の深度用のプログラムを並列にコンパイルします。

落とし穴が 1 つありました。`PCFSoftShadowMap` は r18x で削除されていて、最初のフレームで差し替えると全シェーダーのキャッシュキーが変わって再リンクが走ります。`PCFShadowMap` に変えて、スクリーンショットの差分が最大 1/255 であることを確かめました。

結果はローカルの Lighthouse モバイル（3 回の中央値、gzip 配信）で Performance 77 → 99、TBT 623ms → 1ms、LCP 3.02s → 1.71s、追加修正後は TBT 0ms・LCP 1.21s・CLS 0.001 です。2026-09-30 の本番計測は mobile 98 / desktop 100 でした。

## タブが見えないときは全部止める

`visibilitychange` で描画ループと天気のポーリングを止め、Wake Lock は復帰時に取り直します。`prefers-reduced-motion` のときは静止画です。位置情報はボタンのクリック（ユーザージェスチャー）からしか要求しません。

## ほかの 4 本: 読み込む前に始めない

常時描画でない 4 本は、Three.js を初期バンドルから外すのがほぼすべてです。Skydial はドーム（Three.js）・地図（Leaflet）・AR をタブの初回表示時に `import()` し、初期バンドルは 17.4kB gzip です。天体計算は依存ゼロの Meeus 準拠の自前実装なので、Three.js なしで数値は出せます。Snippet Sprint はゲーム本体を最初のポインタ/キー入力で読み込みます。アイドル時に先読みするとコールドロードの計測に Three.js が入ってしまい、スコアが下がったためです。Hyper Tetris と Tricking 3D はタイトル画面を `index.html` にインラインで置き、クリックで本体を読みます。

5 本の 2026-09-30 計測はモバイルで Hyper Tetris 100、Tricking 3D 100、Snippet Sprint 100、Lumen Bloom 98、Skydial 96 です。

## 参考

- [tktk7l9/lumen-bloom](https://github.com/tktk7l9/lumen-bloom) — commit e137c1f・03d0626（適応 fps）、PR #16（段階的初期化）、`src/orchestrator.ts`・`src/scene/renderer.ts`
- [tktk7l9/skydial](https://github.com/tktk7l9/skydial) — `src/app.ts` の遅延 import
- [tktk7l9/snippet-sprint](https://github.com/tktk7l9/snippet-sprint) — commit b8143c9（先読みをやめた理由）
