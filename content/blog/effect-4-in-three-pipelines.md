---
title: Effect 4 を 3 本のパイプラインに入れてみた
date: 2026-10-06
summary: 2026-09-30 GA の Effect 4.0 を、chronoscroll のビルドパイプライン・Somewhere Now の Cron・AI ニュースダイジェストの日次ジョブに同じ日に導入した記録。型付きの失敗、TestClock でのリトライ検証、Workers の CPU 上限との付き合い方。
tags: [effect, typescript, cloudflare-workers, cron, error-handling]
apps: [chronoscroll, somewhere-now, ai-news-feed-app]
sources:
  - https://github.com/tktk7l9/chronoscroll/pull/40
  - https://github.com/tktk7l9/somewhere-now/pull/59
  - https://github.com/tktk7l9/somewhere-now/pull/60
  - https://github.com/tktk7l9/ai-news-feed-app/pull/41
---

Effect 4.0 が 2026-09-30 に GA になったので、10 月 4 日に 3 本のアプリの「IO が多く、失敗の種類を区別したい」部分だけを書き直しました。ブラウザに届くコードは触らず、ビルド時・Cron・サーバー側のジョブに限定しています。

## chronoscroll: Wikimedia API クライアント（PR #40）

対象はビルド時のデータパイプラインだけで、`effect` は devDependency です。Wikimedia API の失敗を `HttpError / ApiError / NetworkError` に型付けし、既存の `retryDelayMs`（2s × 3^n、上限 60s、`Retry-After` 優先、最大 6 回）をそのまま `Schedule` に載せました。待ち時間は `Clock`、`fetch` は `Context.Reference` にしたので、リトライのタイミングを `TestClock` で検証できます（`pipeline/run/api.test.ts` に 10 テスト、実時間の待ちなし）。

`build.ts` にあった「500 件ずつ取ってキャッシュに保存する」同じ形のブロック 3 つは `fillCache` に統一しました。検証は `--offline` で実キャッシュから実行し、旧実装と出力・ログが 27,137 件で一致することを確認しています。

## Somewhere Now: Cron の経路（PR #59・#60）

Worker の Cron 経路（`worker/youtube.ts`・`refresh.ts`・`scheduled`）だけを書き直しました。`/api/cams` はレイテンシ優先で再試行するものもないので Promise のままです。

- YouTube クライアントの失敗を `YouTubeApiError / YouTubeNetworkError` に型付け。50 件超の id を渡すのは呼び出し側のバグなので `Effect.die` で defect にする
- 再探索はチャンネルごとの失敗を `Effect.result` で「メモ」に変え、実行を止めない
- `update` は本体を `Effect.exit` で包み、台帳の書き戻しが必ず走る（以前の `finally` と同じ意味）
- `scheduled` は `ctx.waitUntil` に「決して失敗しない effect」を渡し、KV の失敗は操作名つきでログに残す

新しく足した `worker/index.test.ts` はメモリ上の KV に対して「失敗時にも台帳が書かれる」「例外が外に漏れない」「予算切れ」「キー欠落」「未知の cron」を検証します。旧実装に対して走らせると 6 本中 5 本が通り、唯一の差分はログに操作名（`KV get cam-state:v1 failed`）が入ったことでした。Worker のバンドルは 3,447 → 3,678 KiB（gzip 561 → 610 KiB）です。

同じ日の PR #60 は Effect とは別の話で、無料プランの CPU 上限 10ms との付き合い方です。Cron は 50〜245ms を使っていて、isolate の許容量を使い切ると数時間にわたって `exceededCpu` で打ち切られていました（直近 7 日の 34%）。打ち切られた実行は状態も台帳も書きません。重い順に、Worker 用のマスタを id と配信元だけの抜粋にして（バンドル評価 41.6 → 18.8ms、サイズ 3,678 → 1,468 KiB）、状態から配信タイトルを外し（1.2MB → 約 750KB）、`videos.list` の応答を `fields` で絞りました（222KB → 15KB）。分かったのは、状態の処理そのものは 14.8 → 13.4ms しか変わらず、重いのは毎回 5,711 台を回すループだったことです。10ms 未満を常に保証はできないので、打ち切りが続くなら有料プランが確実、と PR に書いています。

## AI ニュースダイジェスト: 失敗した段階を残す（PR #41）

動機は、本番の日次ダイジェストが直近 7 回中 2 回 500 を返していたのに、ログにはスタックしかなく、どの段階で落ちたか分からなかったことです。

Supabase の各段階（`load_sources / save_raw / load_candidates / save_articles / save_digest / mark_processed`）を段階名と PostgREST のコードを持つ `DigestStepError` にし、Gemini の失敗は `GeminiError`（filter / summarize）にしました。リトライは従来どおり 3 回・1s → 2s ですが、最後の失敗の後にあった無意味な 4 秒待ちは消しました。RSS は `Effect.forEach` で並列に取り、1 フィードの失敗は結果の `error` になって全体を止めません。ルートのログは `[cron] daily-digest failed: digest step save_raw failed: ... (code=57014)` のような 1 行目になります。

Gemini とフィード取得は `Context.Reference` なので、テストはスタブで差し替えて待ち時間を `TestClock` で検証します（13 テスト追加）。本番 Supabase に書くジョブなのでローカルでは実行せず、マージ後の最初の Cron で確認しました。翌日の実行で RSS ソース 3 件の失敗が段階つきで見え、URL 変更と無効化を PR #42 で直しています。

## 3 本に共通した感想

- 効いたのは「失敗を型で区別する」ことと「リトライを TestClock で検証できる」こと。どちらも既存の処理の意味を変えずに入れられた
- ブラウザ側や `/api/cams` のような薄い経路には入れていない。バンドルが増えるだけで、失敗の種類を区別する相手がいない
- Workers では Effect の有無より CPU 時間の方が先に問題になる。計測して重い順に削る、を Effect 化のあとに別 PR でやった

## 参考

- [chronoscroll PR #40](https://github.com/tktk7l9/chronoscroll/pull/40)
- [somewhere-now PR #59](https://github.com/tktk7l9/somewhere-now/pull/59)・[PR #60](https://github.com/tktk7l9/somewhere-now/pull/60)
- [ai-news-feed-app PR #41](https://github.com/tktk7l9/ai-news-feed-app/pull/41)・PR #42
