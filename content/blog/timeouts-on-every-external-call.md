---
title: 止まった接続は、例外より長く待たされる — 外部呼び出しのタイムアウトを全部見直す
date: 2026-11-02
summary: 2026-10-26 の全リポジトリのレビューで共通して多かった指摘は、外部呼び出しにタイムアウトが無いことだった。SDK ごとの渡し方の違い、上限の値の決め方、再試行に乗せる形、CI の audit-gate が失敗を合格にしていた件を整理する。
tags: [reliability, security-review, cloudflare-workers, ci]
apps: [ai-news-feed-app, chronoscroll, somewhere-now, acro-finder, resume, lumen-bloom, my-apps-portal]
sources:
  - https://github.com/tktk7l9/somewhere-now/pull/78
  - https://github.com/tktk7l9/acro-finder/pull/91
  - https://github.com/tktk7l9/resume/pull/86
  - https://github.com/tktk7l9/lumen-bloom/pull/38
  - https://github.com/tktk7l9/chronoscroll/pull/97
  - https://github.com/tktk7l9/my-apps-portal/pull/96
---

2026-10-26 に公開リポジトリをセキュリティと堅牢性の観点で 1 本ずつ見直しました。共通して多かった指摘は、派手な脆弱性ではなく「外部呼び出しにタイムアウトが無い」でした。

相手がエラーを返せば、例外処理も再試行も働きます。困るのは、エラーも返さず接続が止まる場合です。何も起きないので、用意した仕組みの出番がありません。

## 止まると何が起きるか

| アプリ | 呼び出し | 止まったときの影響 | 上限 |
|---|---|---|---|
| ai-news-feed-app | Gemini | 朝のダイジェストが丸ごと失敗 | 2 分 |
| chronoscroll | Wikimedia API | 既定の待ちで月次更新が 240 分の打ち切りに近づく | 60 秒 |
| somewhere-now | YouTube API | 台帳の書き戻しが遅れ、次の回と消費を消し合う | 10 秒 |
| acro-finder | Resend | 画面が「送信中…」のまま固まる | 15 秒 |
| resume | Resend | 同上 | 10 秒 |
| lumen-bloom | Open-Meteo | 次のポーリングまで接続が張り付く | 10 秒 |
| my-apps-portal | npm・OSV・GitHub | `next build` がビルド上限まで止まる | 15 秒 |

somewhere-now の影響は特に分かりにくいものです。クォータの台帳は最後の呼び出しが返ってから書き戻します。1 本が止まったまま 10 分後の次の回が同じ台帳を読むと、後から書いた方が勝ち、片方の消費が消えます（KV に atomic update はありません）。タイムアウトの有無が、会計の正しさに効いていました。

Workers は外向き fetch に壁時計の制限を設けないので、書かなければ上限はありません。

## SDK ごとに渡し方が違う

「`timeout` を付ける」だけでは済まず、SDK のコードを読む必要がありました。

- **Resend**: SDK は `fetch(url, options)` をそのまま待つ。`send()` の第 2 引数に `{ signal: AbortSignal.timeout(15_000) }` を渡す。中断は throw ではなく `error` で返るので、既存の失敗の分岐に落ちる
- **Google Generative AI**: `RequestOptions` に `timeout` か `signal` を渡したときだけ AbortSignal が付く
- **AWS SDK（R2 同期）**: `requestTimeout` だけでは警告が出るだけ。`throwOnRequestTimeout: true` を足してようやく止まる
- **Effect（chronoscroll）**: `Effect.timeoutOrElse` で包み、`Effect.tryPromise` が渡す `AbortSignal` で fetch を実際に止める。超過は `NetworkError` にするので、既存のバックオフがそのまま効く

共通するのは、タイムアウトを新しい失敗の種類にしないことです。既存の「ネットワーク失敗」に落とせば、再試行もフォールバックも画面の表示も増やさずに済みます。

## 上限の値の決め方

値は根拠を書いて決めています。ai-news-feed-app の 2 分は、通常 1 分以内に返るので余裕を 2 倍以上取り、1 段階の最悪の再試行が Cron 1 回の 15 分に収まることから逆算しました。somewhere-now の 10 秒は、1 回あたり約 40 呼び出しでも Cron の枠に収まる値です。

テストは「signal が渡る」ことだけでなく、できれば実際に止めて確かめます。chronoscroll は TestClock で 59,999 ms では中断せず、60,000 ms で abort し、2 秒後の再試行で成功することを固定しました。ai-news-feed-app は fetch だけを差し替えて、実際の SDK の経路を通しています。

## 失敗を合格にしていたゲート

同じレビューで、もう 1 つ似た形の穴が見つかりました。CI の `scripts/audit-gate.mjs` は、レジストリに届かないなどで `npm audit --json` がレポートを返せないと「0 allowlisted で合格」と出して緑になっていました。`npm_config_registry=http://127.0.0.1:9` で再現できます。修正後は exit 1 で理由を表示し、JSON でない出力も失敗にしています（my-apps-portal [#96](https://github.com/tktk7l9/my-apps-portal/pull/96)、acro-finder [#91](https://github.com/tktk7l9/acro-finder/pull/91) など）。

検査そのものが失敗したら、合格にしない。止まった接続と同じで、「何も起きなかった」を成功と読まないことが大事でした。

## 参考

- [somewhere-now PR #78](https://github.com/tktk7l9/somewhere-now/pull/78)・[acro-finder PR #91](https://github.com/tktk7l9/acro-finder/pull/91)・[resume PR #86](https://github.com/tktk7l9/resume/pull/86)・[lumen-bloom PR #38](https://github.com/tktk7l9/lumen-bloom/pull/38)
- [chronoscroll PR #97](https://github.com/tktk7l9/chronoscroll/pull/97)・[#103](https://github.com/tktk7l9/chronoscroll/pull/103)・[ai-news-feed-app PR #72](https://github.com/tktk7l9/ai-news-feed-app/pull/72)・[my-apps-portal PR #96](https://github.com/tktk7l9/my-apps-portal/pull/96)
- 関連: [朝のダイジェストの記事](/blog/ai-news-missing-morning-digests)
