---
title: 朝のダイジェストが 20 日のうち 8 日欠けていた — 503 の再試行と 13:00 の作り直し
date: 2026-11-02
summary: AI ニュースの毎朝のダイジェストが直近 20 日で 8 日欠けていた。Gemini の 503 を 3 秒で諦めていたのを間隔を空けた再試行に変え、失敗した日を 13:00 に作り直し、応答が止まる場合の 2 分の上限とタグキャッシュも足した。
tags: [ai-news-feed-app, cloudflare-workers, cron, gemini, reliability]
apps: [ai-news-feed-app]
sources:
  - https://github.com/tktk7l9/ai-news-feed-app/pull/61
  - https://github.com/tktk7l9/ai-news-feed-app/pull/65
  - https://github.com/tktk7l9/ai-news-feed-app/pull/66
  - https://github.com/tktk7l9/ai-news-feed-app/pull/72
---

[AI ニュースダイジェスト](/?work=ai-news-feed-app)は、毎朝 6 時（JST）に Cloudflare の Cron Trigger が RSS を集め、Gemini で要約して保存します。2026-10-20 に公開中のアーカイブを見ると、直近 20 日のうち 8 日（10/4・6・8、10/14〜17、10/20）のダイジェストがありませんでした。

Cron の実行結果は毎回 success でした。ルートが返す 500 を handler が握りつぶしていたためです。「成功」の表示と、実際にデータができたかは別の話でした。

## 欠けた日の原因はひとつではない

- **10/20**: Workers Logs に `503 Service Unavailable ... high demand` が残っていた。分類の 1 回目は通り、要約の 2 回目で 503。当時の再試行は 1 秒・2 秒しか待たず、3 秒以内に諦めていた
- **10/14〜17**: Next 16.4.0 の `preview-props.json` を OpenNext が扱えず、Worker が全リクエストで例外を投げていた（[#61](https://github.com/tktk7l9/ai-news-feed-app/pull/61) で next 16.4.2・@opennextjs/cloudflare 1.20.12 に上げて修正）
- **10/4・6・8**: ログの保存期間が過ぎていて追えない

失敗した日を作り直す仕組みも無かったので、一度欠けるとそのままでした。

## 待ってやり直し、それでも駄目なら昼に作り直す

[#65](https://github.com/tktk7l9/ai-news-feed-app/pull/65) の内容は 3 つです。

1. **混雑なら間を空ける**: 503・429・408・5xx と接続断は 15 秒・45 秒・135 秒待ってやり直す（計 4 回）。400 のように待っても直らないものは、これまでどおり 1 秒・2 秒の 3 回で止める
2. **13:00 にもう一度呼ぶ**: 13:00 の Cron（古いレコードの削除）のあとにダイジェストのルートを呼ぶ。無料プランの Cron Triggers は 1 アカウント 5 本までなので、新しい Cron は足していない
3. **その日の分があれば何もしない**: `daily_digests` に行があれば、RSS も Gemini も DB 書き込みも行わず `{ skipped: true }` を返す。これで 13:00 の呼び直しが朝のダイジェストを上書きしない

3 つ目が 2 つ目を安全にしています。再実行が安全なら、やり直しの仕組みはとても単純にできます。各ルートの結果の JSON もログに出すようにしたので、どの日が skipped か失敗かを Workers Logs で見られます。

## 作っても、トップが古いままだった

同じ日に別の問題も見つかりました。ISR のページを R2 に保存するようにしたものの、タグキャッシュが無く、ダイジェストのあとの `revalidatePath("/")` が何もしていませんでした。閲覧は 1 日 50 回ほどなので、6 時より前に作られたトップが朝の人にそのまま出ることがあります。

[#66](https://github.com/tktk7l9/ai-news-feed-app/pull/66) で Durable Object のタグキャッシュ（`doShardedTagCache`）を足し、カテゴリのページも作り直すようにしました。本番と同じ環境で仮のページを使って比べた結果が次の表です。

| | 1 回目 | revalidatePath のあと | その次 |
|---|---|---|---|
| タグキャッシュあり | HIT | MISS → その場で作り直し | HIT（新しい版） |
| タグキャッシュなし | HIT | HIT（ビルド時の版） | HIT（ビルド時の版） |

調べた結果は Cache API に 5 分残すので、ほとんどの閲覧は Durable Object まで行きません。その代わり、ほかの地域では新しいダイジェストが出るまで最大 5 分かかります。

## エラーを返さず止まる場合

10/26 のレビューでは、残っていた穴が見つかりました。`@google/generative-ai` の SDK は `RequestOptions` に `timeout` か `signal` を渡したときだけ fetch に AbortSignal を付けます。渡していなかったので、接続がエラーも返さず止まると、Cron は Worker の実行時間の上限まで待ち、再試行に入れません。判定の側は `Request aborted when fetching` を一時的な失敗として扱う実装でしたが、それを起こすものが無かった形です。

[#72](https://github.com/tktk7l9/ai-news-feed-app/pull/72) で 1 回の呼び出しに 2 分の上限を付けました。通常は 1 分以内に返るので余裕を 2 倍以上取り、1 段階の最悪（4 回 × 2 分 + 待ち 195 秒）が Cron 1 回の上限 15 分に収まる値です。テストは fetch だけを差し替えて実際の SDK を通しているので、SDK の動きが変われば気づけます。

## 参考

- [PR #61](https://github.com/tktk7l9/ai-news-feed-app/pull/61)（Next 16.4 の修正）・[#65](https://github.com/tktk7l9/ai-news-feed-app/pull/65)（再試行と 13:00）・[#66](https://github.com/tktk7l9/ai-news-feed-app/pull/66)（タグキャッシュ）・[#72](https://github.com/tktk7l9/ai-news-feed-app/pull/72)（2 分の上限）
- 関連: [外部呼び出しのタイムアウトの記事](/blog/timeouts-on-every-external-call)
