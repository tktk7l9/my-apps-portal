---
title: 矩形に表れない重なりを採点する — CSS Atelier の当たり判定と WebGL のない端末
date: 2026-10-13
summary: CSS Atelier に、プレビューの指定した点でいちばん手前の要素を調べる当たり判定の採点を足し、z-index や pointer-events のレッスンを作った。WebGL が使えない端末で 3D のあるレッスンが進めなかった問題の直し方も。
tags: [css-atelier, learning-apps, testing]
apps: [css-atelier]
sources:
  - https://github.com/tktk7l9/css-atelier/pull/46
  - https://github.com/tktk7l9/css-atelier/pull/51
  - https://github.com/tktk7l9/css-atelier/pull/54
  - https://developer.mozilla.org/ja/docs/Web/API/Document/elementFromPoint
---

[CSS Atelier](https://css-atelier.saitotakuya0719.workers.dev) は、学習者が書いた CSS をプレビューに当て、矩形と computed 値を読んで採点します（[採点の記事](/blog/css-atelier-auto-grading)）。2026-10-13 の 2 本の PR で、その仕組みを 2 か所広げました（#46・#51）。この日のレッスン追加を含めて、トラックは 87、レッスンは 248 になっています。

## 矩形と computed 値に表れないもの

z-index や重ね合わせコンテキスト、`pointer-events` の効果は、矩形にも computed 値にも表れません。カードに隠れたメニューも、手前に出たメニューも、矩形は同じです。これまで重なり順を扱うレッスンはありませんでした。

#46 で、採点に当たり判定（hit test）を足しました。レッスンが「この要素の箱の、幅と高さの何割の位置」で点を指定すると、プレビューの iframe でその点に `document.elementFromPoint` を呼び、いちばん手前の要素（押したときに反応する要素）の data-id を記録します。箱を基準にした割合なので、プレビューの幅が変わっても図の同じ場所を指します。クリックと同じく重なり順に従い、`pointer-events: none` の要素は通り抜けます。新しい validator の `hitTarget` は、その点でいちばん手前にあるのが期待した要素かを比べ、違えばいま手前にある要素を失敗文に添えます。測っていない点は推測せず不合格にします。

これで、重なり順（z-index・重ね合わせコンテキスト・`isolation`）と押せる範囲（`pointer-events: none`・カード全体をリンクにする書き方・小さなボタンを 44px に広げる）のトラックを作れました。

## 当たり判定だけでは足りない

当たり判定が見るのは、その点でいちばん手前にある要素だけです。最初の試行では、リンクだけを前に出す書き方と、メニューを流れに戻して重ならなくする書き方が通ってしまいました。そこでメニューの縁の点を足し、メニューがヘッダーのすぐ下に重なって開いていることも矩形で確かめるようにしました。光の飾りを消したり隠したりしてボタンを押せるようにする書き方も、飾りが表示されたままかを computed 値で確かめて不合格にします。

新しいレッスンは、実ブラウザで記録した矩形・computed 値・当たり判定の結果を Node で再生するテストに、正解・別解・誤答ごと固定しました。

## WebGL のない端末

#50 の検証中、GPU のない Chrome で全レッスンを巡回すると、3D の図があるレッスンだけ先に進めませんでした。Three.js が WebGL の context を作れずに例外を投げ、プレビューの読み込みまで届かなかったためです。

#51 では、3D のレッスンを初めて開くときに使い捨ての canvas で WebGL 2 が使えるかを確かめ（Three.js r186 は WebGL 2 が必要）、使えなければ Three.js を読み込まずに「この端末では 3D の図を表示できません。プレビューと採点はそのまま使えます。」と出します。WebGL 2 があっても描画の準備に失敗したときは、例外を受けて同じ案内に差し替えます。最初の版は例外を受けるだけでしたが、3D の枠を出してから案内に差し替えるのでプレビューがずれ（CLS 0.294）、事前の確認を足しました。WebGL なしの巡回は、221 レッスン中 203 から 221 すべてのクリアになりました。

## 参考

- [css-atelier PR #46](https://github.com/tktk7l9/css-atelier/pull/46)（当たり判定と hitTarget）・[#51](https://github.com/tktk7l9/css-atelier/pull/51)（WebGL のない端末）・[#54](https://github.com/tktk7l9/css-atelier/pull/54)（248 レッスンの巡回）
- [MDN: Document.elementFromPoint()](https://developer.mozilla.org/ja/docs/Web/API/Document/elementFromPoint)、[MDN: pointer-events](https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/pointer-events)、[MDN: 重ね合わせコンテキスト](https://developer.mozilla.org/ja/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
