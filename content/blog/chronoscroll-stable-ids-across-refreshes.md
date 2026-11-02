---
title: 本文のハッシュを id にしたら、月次更新で特集が減った — chronoscroll の id の継続
date: 2026-11-02
summary: chronoscroll の月次更新が、特集が 1,927 件から 1,922 件に減って失敗した。原因は本文のハッシュを含むイベント id と、7 日で消える Actions cache。消えた id を同じ日の最も近い行に結び付け、対応を記録して直した。
tags: [chronoscroll, data-pipeline, data-quality, github-actions]
apps: [chronoscroll]
sources:
  - https://github.com/tktk7l9/chronoscroll/pull/103
  - https://github.com/tktk7l9/chronoscroll
---

[chronoscroll](/?work=chronoscroll) の年表は、ja.wikipedia の年ページを毎月取り直して作ります。2026-11-02 の月次更新（`data-refresh`）が失敗し、調べると特集の件数が 1,927 件から 1,922 件に減っていました。直接落ちたのは README の件数を検査する `readme-stats` ですが、それは結果で、原因はイベントの id の作り方にありました。修正は [#103](https://github.com/tktk7l9/chronoscroll/pull/103) です。

## なぜ今月だけ起きたのか

イベントの id は「日付 + 本文のハッシュ」です。年ページの行が編集されると、表記の違いだけでも id が変わります。一方で、手で書いた修正（`content/curated`）、特集（`content/collections`）、公開 URL の `/e/<id>` は、どれも id を指しています。

年ページのキャッシュは Actions cache にしかなく、7 日で消えます。9/27 → 10/2 は 5 日差でキャッシュが効きましたが、10/2 → 11/2 は全年を取り直しました。間隔が 1 か月なら、これが毎月の通常の状態です。つまり 1 か月分の編集がまとめて入る最初の回で、たまたま今月表に出ただけでした。

結果は次のとおりです。

- 47 件の id が消えた。うち curated が 13 件で、10 件は今回新しく外れた（残り 3 件は 10 月の時点で既に不一致）
- 特集の 5 件もここに含まれる
- 例は「アメリカ連邦準備法」→「連邦準備法」、「npm left-pad削除事件」→「left-pad事件」

特集が減るだけでなく、手で直した要約が外れ、`/e/` の URL も孤立していました。件数の検査で気づけたのは運がよかったと言えます。

## 消えた id を、同じ日の最も近い行に結び付ける

`pipeline/lib/id-continuity.ts` を足しました。

- 前回配信した id のうち生成結果から消えたものを、同じ日の新しい行のうち最も近いものに結び付ける。近さの判定は近似重複の除去と同じルールを使う
- 結び付けは 1 対 1 で、日付はまたがない。同点でも実行順で結果が変わらない
- 組は `pipeline/sidecar/id-aliases.json` に記録し、data-refresh がコミットする
- 後継の無い curated・特集のイベントは、前回の配信内容のまま残してログに警告を出す

記録が要るのは、curated の本文が手書きだからです。前回の本文が手書きの要約だと、翌月の年ページの行とは似ていないことがあります。一度結び付けた組は本文を見ずに使います。

再発の検知も足しました。`content.test.ts` が、配信された特集の件数と YAML のエントリ数の一致を確かめます。

## 検証

取得済みの年ページを `--offline` で流し直して比べました。データはこの PR ではコミットしていません。

| | 修正前 | 修正後 |
|---|---|---|
| 消えた id | 47 | 7 |
| 特集の件数 | 1,922 | 1,927 |
| curated の不一致 | 13 | 3（10 月から既にあるもの） |
| `readme-stats --write` | exit 1 | exit 0 |

残った 7 件は、年ページから行が消えたか大きく書き換えられたもので、curated ではありません。結び付いた 39 組は目視で全件確認し、2 回続けて実行しても aliases と id が変わらないことも見ています。

## 同じ PR で直した 2 点

**`/e/*` の HTML を毎回再検証に**: `max-age=3600` を `public, max-age=0, must-revalidate` にしました。Worker の応答は Cache API を使わない限り CDN に載らないので、`max-age` はブラウザにしか効いていません。ETag と R2 の `onlyIf` による 304 はそのままなので、再訪問で 1 往復増えても本文は再送しません。

**R2 同期のタイムアウト**: S3 クライアントに `connectionTimeout` 10 秒、`requestTimeout` 60 秒、`throwOnRequestTimeout: true` を設定しました。この SDK は `requestTimeout` だけだと警告が出るだけで止まりません。応答しないローカルサーバーで確かめると、8 秒待っても固まったままで、`throwOnRequestTimeout` を付けると `TimeoutError` になり、3 回試行して終わりました。

## 参考

- [chronoscroll PR #103](https://github.com/tktk7l9/chronoscroll/pull/103)（id の継続・`/e/` の再検証・R2 のタイムアウト）
- 関連: [特集の監査の記事](/blog/chronoscroll-collection-audit)、[R2 と Worker の配信の記事](/blog/chronoscroll-r2-worker-hybrid)
