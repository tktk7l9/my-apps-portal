---
title: CSS の課題を自動で採点する
date: 2026-10-07
summary: CSS Atelier を 37 レッスンから 80 レッスンに増やしたときの採点の作り方。計算値と描画位置の使い分け、実ブラウザで記録した値を Node で再生するテスト、column-reverse で作るスクロール済みの状態、判定を見送ったもの。
tags: [css-atelier, learning-apps, testing]
apps: [css-atelier]
sources:
  - https://github.com/tktk7l9/css-atelier/pull/26
  - https://github.com/tktk7l9/css-atelier/pull/33
  - https://github.com/tktk7l9/css-atelier/pull/34
  - https://github.com/tktk7l9/css-atelier/pull/36
  - https://github.com/tktk7l9/css-atelier
---

[CSS Atelier](https://css-atelier.saitotakuya0719.workers.dev) は、解説を読んで CSS を書くと自動で採点される学習アプリです。2026-10-06 の 4 本の PR で、15 トラック 37 レッスンから 31 トラック 80 レッスンにしました（#26・#33・#34・#36）。学習者の CSS をサンドボックスの iframe に当てる仕組みは[学習アプリ 3 本の記事](/blog/live-code-under-strict-csp)に書いたので、ここでは採点の作り方を書きます。

新しいレッスンのために、判定の部品を足す必要はありませんでした。どれも既存の `computedEquals`・`computedMatches`・`sourceMatches`・`sizeApprox`・`alignedEdge`・`order`・`allOf` の組み合わせです。

## 計算値で見るか、描画位置で見るか

判定には、`getComputedStyle` の計算値と `getBoundingClientRect` の矩形を使います。書いた CSS の文字列（`sourceMatches`）は、特定の書き方を求めるときの補助です。

`clip-path`・`mask-image`・`filter`・`mix-blend-mode` は描画だけが変わり、要素の矩形は変わらないので、計算値で判定します。ブラウザごとの書き方の差（`0` と `0px`、`transparent` と `rgba(…, 0)` など）は受け付け、`circle(50%)` のように形が変わる書き方は落とします。

位置や大きさが答えになる課題は、矩形で見ます。

- `round()`: 幅 230px と 170px の 2 つの棚で、タイルの列が 200px と 160px になるか。片方に合わせて `width: 200px` と書くと、もう片方で落ちる
- `perspective`: 計算値に加えて、カードの描画上の高さを見る。`getBoundingClientRect` は射影後の外接矩形を返すので、100px のカードが 118.09px になる
- `preserve-3d`: 右と上の面の描画サイズを見る。立体なら 58px と 51px、`opacity` などで平面に押しつぶされると 3px と 21px になるので、その原因まで伝えられる
- アンカーポジショニング: どこに描画されたかで判定するので、別の書き方でも通る

## 実ブラウザで記録して、Node で再生する

採点の関数は、計算値と矩形のスナップショットを受け取る純関数です。そこで `recorded-snapshots.test.ts` では、実ブラウザ（ヘッドレス Chrome 154）のサンドボックスで記録した値と矩形を Node で再生し、新しいレッスンすべてで「初期状態のコードは不合格、解答は合格」を固定しています。#36 では、グラデーションの書き方の違い 23 通りの合否もここで固定しました。Chrome は 2 位置の色止まりを 2 つに展開し、`turn` を `deg` に直して返すので、正規表現はその揺れを受け付けつつ、角度・しまの幅・色の順番は固定しています。

`content.test.ts` には、全レッスンにかかる不変条件もあります。初期状態のコードと解答が同じでないこと、解答が `sourceMatches` を満たすこと、計算値の判定で使うプロパティを記録の対象に含めていること、などです。最後に、ブラウザで全 80 レッスンを開いて初期状態のまま「チェック」し、続けて「解答を見る → チェック」を実行しました。解答は 80/80 が通り、初期状態で通るレッスンは 1 つもありませんでした。

## スクロールした状態をスクリプトなしで作る

`position: sticky` は、スクロールしないと効いたかどうかが分かりません。ところが、サンドボックスの iframe はスクリプトで中をスクロールできません。#36 では、スクロールする箱を `flex-direction: column-reverse`（表は `row-reverse`）にしました。スクロールの起点が終わり側に来るので、プレビューは一番下までスクロールした位置から始まります。チャット画面でよく使う仕掛けです。

その位置では、sticky でない見出しは画面の外（y = -201.52）にあり、貼り付いた見出しは箱の端（0）にあるので、`alignedEdge` で判定できます。計算値の `position: sticky` と `top: 0px` も見るので、学習者がプレビューを先頭まで戻してからチェックしても結果は変わりません。

## 判定しにくいものをどう扱うか

- `text-wrap: pretty`: Firefox は未対応で、計算値が `auto` になる。どのブラウザでも解けるように、書いた CSS の文字列で判定する
- スクロールスナップ: 止まる位置はスクロール中にしか現れないので、`scroll-snap-type` などの計算値で判定する
- `:user-invalid`: 「入力して欄を離れた後だけ赤くなる」には利用者の操作が要る。そこで、`:invalid` には最初から当てはまり `:user-invalid` には決して当てはまらない `hidden` の入力欄を「まだ触っていない欄」の代わりに置き、その枠が赤くないことだけを判定する。本文にもそう書いた
- `prefers-reduced-motion` などのユーザー設定: サンドボックスの iframe は学習者の OS やブラウザの設定を引き継ぎ、アプリからは切り替えられない（変えられるのはビューポートの幅だけ）。結果が学習者の設定しだいで変わるので、レッスンにしていない

## 対応状況は MDN で確かめる

レッスンを足す前に、MDN（2026-10 時点の互換性データと Baseline）で対応状況を確かめ、Baseline でない機能や新しい機能はレッスンの本文に対応ブラウザを書いています。たとえば `@scope` は Baseline 2026 の新規（Firefox 146・Safari 26.4）、`text-wrap: pretty` は Baseline 未達、`display` のトランジション（`allow-discrete`）は Firefox 未対応です。最後のものは `transition-behavior` の計算値で採点するので、Firefox でも解けます。#26 では既存レッスンの MDN へのリンク 33 件を、現在の構成（`Reference/`・`Guides/`）に直しました。旧パスは全件 301 で、新パスは全件 200 でした。

## 参考

- [css-atelier PR #26](https://github.com/tktk7l9/css-atelier/pull/26)（サブグリッド・色の関数・アンカー・出現と退場、MDN へのリンクの更新）
- [css-atelier PR #33](https://github.com/tktk7l9/css-atelier/pull/33)（@scope・text-wrap・スクロールスナップ・@property、記録した値の再生テスト）
- [css-atelier PR #34](https://github.com/tktk7l9/css-atelier/pull/34)（クリップとマスク・フィルター・3D 変形・数学関数、ユーザー設定を見送った理由）
- [css-atelier PR #36](https://github.com/tktk7l9/css-atelier/pull/36)（グラデーション・縦書き・sticky・フォーム）
- [CSS Atelier の README](https://github.com/tktk7l9/css-atelier#readme)（31 トラック・80 レッスン）
