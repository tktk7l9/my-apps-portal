---
title: 古い特集 32 本を主題の記事と照らし直す — chronoscroll の特集の監査
date: 2026-10-13
summary: chronoscroll の初期に作った特集 32 本を、日付だけでなく文言も主題の Wikipedia 記事と照らして見直した。968 件を確認し、128 件を直して 26 件を外した。どんな誤りがあり、どう確かめたか。
tags: [chronoscroll, fact-checking, data-quality]
apps: [chronoscroll]
sources:
  - https://github.com/tktk7l9/chronoscroll/pull/81
  - https://github.com/tktk7l9/chronoscroll/pull/85
  - https://github.com/tktk7l9/chronoscroll/pull/86
  - https://github.com/tktk7l9/chronoscroll/pull/88
  - https://chronoscroll.saitotakuya0719.workers.dev/c
---

[chronoscroll](https://chronoscroll.saitotakuya0719.workers.dev) の特集は、テーマに沿った出来事を年代順に読むページです（[特集の記事](/blog/chronoscroll-collections-from-existing-events)）。新しい特集では、候補の日付と文言を主題の記事と突き合わせ、食い違うものは直すか外してきました。2026-10-13 に、その基準ができる前に作った古い特集 32 本を、4 本ずつ 8 回の PR で見直しました（#81〜#88）。

## 結果

| | 確認 | 修正 | 除外 |
|---|---:|---:|---:|
| 8 回の合計 | 968 | 128 | 26 |

回ごとの差は大きく、建築・人権・ゲーム・美術の回は 119 件を確認して修正 1 件、アニメ・ブレイクダンス・観葉植物・AI 史の回は 103 件で修正 59 件・除外 12 件でした。後者のうち 3 本は、年ページに載らない出来事を特集の YAML に直接書いたもので、出典の記事にない言い方が多く残っていました。

## どんな誤りがあったか

- **日付**: 東京馬車鉄道の環状線の開通（10 月 2 日 → 25 日）、映画芸術科学アカデミーの創立（5 月 4 日は書類の提出日で、創立は 11 日）、ダートマス会議（6 月 → 7 月）
- **言い過ぎ**: はやぶさの「世界初」は月以外の天体からの話（月からは 1970 年にルナ 16 号が持ち帰っている）。YS-11 は初の国産旅客機ではなく、戦後初めて日本のメーカーが開発した旅客機。エアハートは同乗者として大西洋を渡った初の女性
- **主語の取り違え**: 彗星に着陸したのはロゼッタではなく、切り離された着陸機フィラエ
- **出典の不備**: 存在しない記事や曖昧さ回避のページを指していた出典を、日付の書かれた記事に差し替えた
- **年を確かめられないもの**: 観葉植物の特集では、流行そのものはあっても、どの記事にもその年が書かれていない 10 件を外した

## どう確かめたか

1 件ずつ、要約の文言と日付を主題の記事（ja と、必要に応じて en）と照らしました。記事どうしで日付が割れているものや、時差で日付がずれるもの（スターシップ SN10 は現地の日付）は、理由を添えて「あえて変えなかったもの」に残しています。

直し方は既存の仕組みのままです。年ページ由来の出来事は `content/curated/fixes.yaml` の上書きで直し、id（日付と元の本文のハッシュ）は変えません。日付を動かすのは同じ年の中だけで、年をまたぐものは直さずに特集から外しました（シベリア鉄道の一区間など）。特集の YAML に直接書いた出来事は YAML を直し、外した 11 件は年表からも消えて、総数は 27,451 件から 27,440 件になりました。各 YAML の冒頭には、何を確かめて何を直し、何を外したかを記録しています。

生成データは取得のパイプラインを回さず、コミット済みのチャンクに上書きを当て直して作りました。先に「上書きを変えずに再出力するとバイト単位で一致する」ことを確かめてから修正を当てるのは、[残骸の修正](/blog/chronoscroll-residue-and-suppress)と同じ手順です。どの回でも、全ページの `/e/` リンク（約 8 万 4 千本）が実在するページに解決することと、本番と同じ CSP でのスモーク 120 シナリオ、実ブラウザでの特集ページと直した個別ページの表示を確かめています。

## 参考

- [chronoscroll PR #81](https://github.com/tktk7l9/chronoscroll/pull/81)（宇宙開発・鉄道・映画・航空）・[#82](https://github.com/tktk7l9/chronoscroll/pull/82)・[#83](https://github.com/tktk7l9/chronoscroll/pull/83)・[#84](https://github.com/tktk7l9/chronoscroll/pull/84)・[#85](https://github.com/tktk7l9/chronoscroll/pull/85)・[#86](https://github.com/tktk7l9/chronoscroll/pull/86)・[#87](https://github.com/tktk7l9/chronoscroll/pull/87)・[#88](https://github.com/tktk7l9/chronoscroll/pull/88)（アニメ・ブレイクダンス・観葉植物・AI 史）
- [特集の一覧 /c](https://chronoscroll.saitotakuya0719.workers.dev/c)（2026-10-13 時点で 64 本 1,927 件）
