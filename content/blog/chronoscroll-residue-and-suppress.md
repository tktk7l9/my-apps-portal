---
title: 年表の要約に残ったパーサの残骸を数えて直す — chronoscroll の検出器と suppress.yaml
date: 2026-10-11
summary: chronoscroll の要約に残っていた日付の断片や {{Cite の切れ端を検出器で数え、469 件を年ページの元の行と突き合わせて直した。種類ごとの件数に上限を置いて戻りを防ぎ、イベントでない行は新しい suppress.yaml で取り除いた。
tags: [chronoscroll, data-quality, fact-checking]
apps: [chronoscroll]
sources:
  - https://github.com/tktk7l9/chronoscroll/pull/62
  - https://github.com/tktk7l9/chronoscroll/pull/63
  - https://github.com/tktk7l9/chronoscroll/pull/65
  - https://github.com/tktk7l9/chronoscroll/pull/69
  - https://github.com/tktk7l9/chronoscroll
---

[chronoscroll](https://chronoscroll.saitotakuya0719.workers.dev) のイベントは、ja.wikipedia の「YYYY年」「YYYY年の日本」の年ページを 1 行 1 イベントとして読んで作っています。特集を組むためにイベントを読み比べていくと（[特集の記事](/blog/chronoscroll-collections-from-existing-events)）、パーサが落としきれなかったテンプレートの跡や、出典と日付が食い違うものが見つかりました。2026-10-10〜11 の PR で、これを数えてから直しました。

## 残骸を数える検出器

#62 で `pipeline/lib/residue.ts` を足しました。タイトルと要約から、残骸を種類ごとに数える純関数です（カバレッジ 100%）。表示名を指定した `{{仮リンク|…|label=…}}` が記事名で描画される落ち方は本文からは見分けられないので、年ページのキャッシュを走査して 48 件を見つけ、#62 で 45 件を直しています。#63 の前後の件数は次のとおりです。

| 種類 | 例 | 前 | 後 |
|---|---|---:|---:|
| leading_date | 本文の先頭に残った「18日 - 」 | 263 | 2 |
| see_also | 「…を参照」 | 70 | 1 |
| braces | 次の行に続く `{{Cite …` の切れ端 | 62 | 0 |
| unbalanced | 括弧の開閉が合わない | 35 | 0 |
| ほか 5 種 | 「。。」・`&nbsp;`・空の「」など | 46 | 0 |
| 該当イベント | | 472 | 3 |

## 年ページの元の行から直す

#63 では 472 件すべてについて年ページを読み直し、リポジトリのパーサと同じ手順で id を計算し直して元の行を特定しました。直した文はその行から作っています。直し方は `content/curated/fixes.yaml` の上書きで、id（日付と元の本文のハッシュ）は変えません。

- 複数行の `<ref>{{Cite …}}` で切れた本文（63 件）は、続きの行ごとパーサに通して年ページの表示どおりに
- 日付の断片（260 件）は、月単位のイベントならその日に。範囲の終わりは「（15日まで）」と本文に入れる
- 参照書き（67 件）は外し、`&nbsp;` や括弧も年ページの行どおりに

日付を動かしたのは 190 件で、年をまたぐものはありません。`?e=<id>` のディープリンクは id の先頭の日付から読むチャンクを決めるので、年をまたぐ訂正は `crossYearDateOverrides` でテストを落とします。作業の前には毎回、上書きを変えずに再出力し、コミット済みのデータとバイト単位で一致することを確かめました。

## 上限で戻りを防ぐ

残った件数を、種類ごとの上限（`RESIDUE_CEILING`）にしました。コミット済みのデータが上限を超えると CI が落ち、上限を 1 下げても落ちることを確かめています。月次のデータ更新ジョブでは警告の注記だけにして、更新の PR は作られるようにしました。運用は「直したら下げる、上げない」です。

## イベントでない行を取り除く suppress.yaml

残った 3 件のうち 2 件は、そもそもイベントではありませんでした。`<ref>` の中にあった裁判官名の箇条書きと、本文のない「…も参照」の行です。curated の層には上書きと追加しかなかったので、#65 で `content/curated/suppress.yaml` を足しました。エントリは id と理由だけで、同じ id への上書きがあっても suppress が勝ちます。チャンク・検索・特集・関連リンクのどこにも残っていないことをテストで確かめ、総数は 27,453 件から 27,451 件になりました。消えた 2 件の `/e/` ページは、R2 への差分同期が manifest に従って削除し、Worker は 404 を返します。

検出器はその後も広げています。「夏季 - 」のような季節の語（#65）と、「12月19日(明治4年11月8日) - 」のような括弧つきの日付（#69）で、見つかった 2 件と 3 件も直しました。上限に残っているのは `leading_date: 2` だけです。

## 参考

- [chronoscroll PR #62](https://github.com/tktk7l9/chronoscroll/pull/62)（検出器と仮リンクの 45 件）・[#63](https://github.com/tktk7l9/chronoscroll/pull/63)（469 件の修正と上限）・[#65](https://github.com/tktk7l9/chronoscroll/pull/65)（suppress.yaml）・[#69](https://github.com/tktk7l9/chronoscroll/pull/69)（括弧つきの日付）
- [chronoscroll の README](https://github.com/tktk7l9/chronoscroll#readme)（27,451 件・特集 44 本 1,372 件）
- [年表](https://chronoscroll.saitotakuya0719.workers.dev)
