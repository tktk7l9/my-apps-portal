---
title: ソシオメディア HIG 100 項目を UI 見直しの物差しにしている話
date: 2026-10-06
summary: 確認ダイアログを取り消し通知に置き換える（57・54）、戻るで閉じる（59・60・82）、色だけに頼らない（96）、7mm のタップ領域（78）、寛容な入力（50）。コミットに番号を添えて 2026 年 9〜10 月に全リポジトリを 2 巡した記録。
tags: [shig, ux, accessibility, design]
apps: [utility-tracker, agent-cockpit, skydial, acro-finder, resume, snippet-sprint]
sources:
  - https://www.sociomedia.co.jp/category/shig
  - https://github.com/tktk7l9/utility-tracker/pull/52
  - https://github.com/tktk7l9/agent-cockpit/pull/29
  - https://github.com/tktk7l9/acro-finder/pull/49
  - https://github.com/tktk7l9/resume/pull/53
---

2026 年 9 月下旬から、新規アプリと既存アプリの UI 変更をソシオメディアのヒューマンインターフェースガイドライン（SHIG、100 項目）に照らして進めています。ルールは単純で、UI に触る PR やコミットには該当する番号を添える、というものです。`utility-tracker` の PR #52 なら「添加・編集も取り消せるようにし (SHIG 40,67,79,54,22,28,59,85)」のように書きます。

番号を書く効用は、レビューのときに「なぜそうしたか」を思い出せることと、同じ番号が何度も出てくる項目が自分の癖だと分かることです。よく出た項目を具体例と一緒に挙げます。

## 57・54: 黙って実行し、取り消しで守る

確認ダイアログは「本当に削除しますか？」を毎回読ませる割に、慣れると読まずに OK を押します。代わりに即座に実行して、取り消せる通知を出す方針です。

- agent-cockpit PR #29: 直前の保存・削除・復元を取り消す undo IPC を追加
- utility-tracker PR #52: 追加・編集も取り消せるように
- skydial PR #21: GPS で位置を取ったあとも元の位置に戻せる
- snippet-sprint PR #22: タイピングのミスを取り消す

取り消し通知には注意点があり、通知が見えているあいだは実際の削除を待ち、フォーカスを通知に移す実装にしています（94・78 と同時に対応）。

## 59・60・82: 居場所が分かり、逃げ道があり、戻れる

モーダルやパネルの状態を URL に載せ、ブラウザの戻るで閉じられるようにしています。このポートフォリオの `?work=<id>` もその一つです。acro-finder PR #49 では地図と一覧の対応付けと「戻るで閉じるパネル」、ai-news-feed-app PR #36 では日本語の 404 と建設的なエラー表示、resume PR #53 では読み終えた先に問い合わせを置き、目次の移動を即時にしました。

PWA では OS の戻るジェスチャーが「アプリを出る」になりがちなので、戻りリンクを画面内に明示するのを基本にしています。

## 96: 色だけで区別しない

utility-tracker PR #46 では前年同月比を「今年と前年」の 2 本の棒にして、色以外の手がかりで見分けられるようにしました。css-atelier PR #21 の axe 違反 819 → 0 でも、結果バナーのコントラストと見出し階層、エディタのフォーカス表示が主な修正でした。このブログのタグ絞り込みも、選択中のタグに `aria-current` とチェックマークを付けて、色だけに頼らないようにしています。

## 78: 7mm のタップ領域

resume PR #53「タップ領域を 7mm にそろえる」をはじめ、acro-finder・housing-performance-simulator・css-atelier・skydial で繰り返し出てきた番号です。リンクの文字サイズは小さいままでも、`min-height: 44px` 程度の当たり判定を確保します。このブログのカードは見出しのリンクをカード全体に広げています。

## 50・46: 寛容な入力、正規化は内側で

utility-tracker PR #45 では金額入力を寛容にし、CSV の文字コードを自動判定し、次の検針期間を初期値にしました。somewhere-now PR #57 の地名検索は全角・大小・ダイアクリティクス・かなを同じものとして扱います。housing-performance-simulator PR #65 は「入力を変えたら結果を自動で計算し直す」で、計算ボタンを押させません。

## 1・11: ノイズと実装用語を消す

sumai-log の見直しでは未登録の「—」と空の枠を消し、css-atelier PR #22 では失敗メッセージに現在値（「現在 0px」）を入れて、何を直せばいいかが分かる文にしました。glsl-atelier PR #18 も同じ趣旨で「失敗を建設的に」しています。

## 進め方

1 巡目は 2026-09-28〜30、2 巡目（「SHIG 2 周目」）は 10 月 1 日に skydial・snippet-sprint・acro-finder・css-atelier で行いました。型は「全画面のスクリーンショットを撮る → 該当する項目だけ列挙する → 束ねて 1 つの PR にする」です。100 項目を全部チェックリストにすると終わらないので、画面を見て引っかかった項目だけを書き出すようにしています。

## 参考

- [ソシオメディア ヒューマンインターフェースガイドライン](https://www.sociomedia.co.jp/category/shig)
- [utility-tracker PR #52](https://github.com/tktk7l9/utility-tracker/pull/52)・PR #45・PR #46
- [agent-cockpit PR #29](https://github.com/tktk7l9/agent-cockpit/pull/29)、[acro-finder PR #49](https://github.com/tktk7l9/acro-finder/pull/49)、[resume PR #53](https://github.com/tktk7l9/resume/pull/53)
- skydial PR #20・#21、snippet-sprint PR #22、css-atelier PR #21・#22
