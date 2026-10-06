---
title: chronoscroll — 27,137 件の年表を R2 + Worker のハイブリッドで配る理由
date: 2026-10-06
summary: 静的アセットの上限 20,000 ファイルに収まらない 27,231 ファイルを、イベント個別ページだけ R2 に置くことで無料枠のまま配信した設計。差分同期・プレビュービルドのガード・大量削除の安全弁について。
tags: [chronoscroll, cloudflare-workers, cloudflare-r2, sveltekit, static-site]
apps: [chronoscroll]
sources:
  - https://github.com/tktk7l9/chronoscroll
  - https://github.com/tktk7l9/chronoscroll/blob/main/AGENTS.md
  - https://github.com/tktk7l9/chronoscroll/pull/24
---

[chronoscroll](https://chronoscroll.saitotakuya0719.workers.dev) は、1829 年から現在までの歴史ニュース 27,137 件を縦の無限スクロール年表で探索する Svelte 5 + SvelteKit（adapter-static）のサイトです。ズームすると表示が変わる「セマンティックズーム」が特徴ですが、この記事はデータと配信の話です。

## データはビルド時に作ってコミットする

ja.wikipedia の「YYYY 年」と「YYYY 年の日本」の 2 シリーズから「できごと」節の wikitext をパースし、注目度をスコアリングして静的 JSON を生成します。注目度は、リンク先記事の Wikidata sitelinks 数と日本語版ページビューの大きい方を採り（ja 版は記事が分割されていて重大事件でも sitelinks が少ない。関東大震災は 3 言語版）、頻出リンク先には IDF 減衰、地名には 0.35 の減衰を掛けてから十年ごとのパーセンタイルに正規化します。

2 シリーズ間の表現違い（兵庫県南部地震と阪神・淡路大震災）は文字 bigram の Jaccard ≥ 0.5 で重複と判定しますが、「〜法律案が参議院本会議で可決、成立」のような定型文を誤統合しないよう、内部リンク先が重なることを条件にしています。関連イベントは同じ Wikipedia 記事を出典に持つもの同士を自動で結び、全体の約 39% に付与されました。

生成物はリポジトリにコミットし、デプロイ時に Wikipedia を叩きません。月次の GitHub Actions がパイプラインを回し、差分があるときだけ PR を作ります。

## 27,231 ファイルという壁

2026-08-11 の Vercel 停止後、他の 14 本は Cloudflare Workers へ移せましたが、chronoscroll だけ止まっていました。ビルド出力が 27,231 ファイル（205 MB）で、無料プランの静的アセット上限 20,000 ファイルに収まらないからです。99.6% は `/e/<id>` のイベント個別ページで、残りは 94 ファイル・約 30 MB でした。

選択肢は 4 つありました。

1. Workers 有料プラン（上限 100,000 ファイル、コード変更ゼロ）
2. 20,000 ページ未満に絞る（ロングテール約 7,000 ページ・26% を失う）
3. D1 に 27,051 行を入れる（静的 HTML の長所を失う）
4. `/e/` の HTML だけ R2 に置き、残りは静的アセットのまま

2026-09-26 に 4 を選びました。`wrangler.jsonc` で `run_worker_first: ["/e/*"]` を指定し、Worker が `/e/*` を先に受けて R2 バケットから返します。GET/HEAD 以外は 405、`/e/<id>.html` や末尾スラッシュは 301 で正規化、id は `^[A-Za-z0-9._-]+$` に限定、ETag と `If-None-Match` で 304、`Cache-Control: public, max-age=3600, stale-while-revalidate=86400` を付けます。ランニングコストは 0 円です。

## 差分同期と 2 つの安全弁

ビルド後に `build/e` を `build-e/` へ分離し（`wrangler deploy` は `build/` を丸ごと上げるため）、`scripts/r2-sync.mjs` が S3 互換 API で同期します。各 HTML の sha256 を R2 上の `manifest.json` と突き合わせ、変わったものだけ PUT、消えたものは DELETE、最後に manifest を書き直します。DELETE に失敗したキーは manifest に古いハッシュを残し、次回に再試行します。初回は 27,137 件の PUT に 5 分 51 秒、2 回目は skip 27,137 で冪等でした。

安全弁は 2 つです。`WORKERS_CI_BRANCH` が `main` 以外ならプレビュービルドとみなして同期をスキップします（プレビューが本番バケットを書き換えないように）。そして `isMassDelete` が、ローカルが空のときや削除予定がリモートの 10% を超えるときに止まります。空のビルド出力で全削除する事故を防ぐためです。

受け入れた弱点もあります。スタイルを変えた直後、R2 の HTML がまだデプロイされていないハッシュ付き CSS を参照する約 1 分の窓があります。

## SvelteKit と厳格 CSP の両立

静的アセット側は Observatory A+（115）を保っています。SvelteKit の起動インラインスクリプトはビルド後に `scripts/externalize-inline.mjs` で外部ファイル化し（0 件なら失敗にする）、`paths.relative: false` で `import()` を絶対パスに、ルートアナウンサーの固定 `style` 属性は `style-src-attr` の sha256 で許可しています。CI では本番同等の CSP ヘッダーを配った状態で実ブラウザのスモーク 54 シナリオを回しています。

## 参考

- [tktk7l9/chronoscroll](https://github.com/tktk7l9/chronoscroll) — `docs/superpowers/specs/2026-09-26-cloudflare-r2-hybrid-design.md`、AGENTS.md
- [PR #24](https://github.com/tktk7l9/chronoscroll/pull/24)「Cloudflare Workers へ移行（/e/ は R2 配信のハイブリッド）」
- PR #26〜#29（月次更新の 429 対策・リトライ条件・PR 作成失敗の可視化）
