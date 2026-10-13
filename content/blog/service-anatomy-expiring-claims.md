---
title: いつか古くなる記述に期限を付ける — Service Anatomy の expires
date: 2026-10-13
summary: キャンペーンの終了日や月ごとの料率のように、いつか正しくなくなる記述を記事の frontmatter に expires として登録し、期限を過ぎたものをテストと freshness の一覧に出すようにした。最初に見つかった 2 件の書き直しまで。
tags: [service-anatomy, content-modeling, fact-checking]
apps: [service-anatomy]
sources:
  - https://github.com/tktk7l9/service-anatomy/pull/134
  - https://github.com/tktk7l9/service-anatomy/pull/137
  - https://serviceanatomy.com/ja/articles/xserver
---

[Service Anatomy](https://serviceanatomy.com) の記事は、料金やキャンペーンを公式ページから引いて書きます（[記録としての記事](/blog/service-anatomy-articles-as-records)）。記事全体を最後に確かめた日は `lastVerified` で分かりますが、「10 月 5 日までの半額キャッシュバック」のような記述は、その日を過ぎた時点で誤りになります。2026-10-13 に、こうした記述に期限を付ける仕組みを入れました（#134）。

## expires に登録する

記事と比較の frontmatter に、その記述が成り立つ最後の日と、何を確かめ直すかを書きます。

```yaml
expires:
  - date: "2026-10-31"
    claim: "10月のサービス維持調整費25.50%と、それを含めた価格"
```

日付はキャンペーンの終了日、月ごとの料率ならその月の末日です。ja と en で日付と並び順が一致することもテストで確かめます。公開している `/api/anatomy.json` は項目を選んで出しているので、`expires` は外に出ません。

## 期限を過ぎたら一覧に出す

- `npm run freshness` が、これまでの `lastVerified` の一覧に続けて登録された記述を日付順に出し、期限を過ぎたものに ⚠ を付ける（`--ci` を付けると、期限切れがあれば終了コード 1）
- 記事と比較のテストでは、期限を過ぎた記述を `it.todo` にする。CI は落とさず、テスト結果の todo の数と一覧に出る

形式の検証（日付の書式、空の claim など）と、期限の境目（最後の日はまだ期限内）もテストにしています。

## 最初の 2 件を書き直す

#134 で 12 件を登録した時点で、2 件はもう期限を過ぎていました。エックスサーバーの半額キャッシュバック（10 月 5 日まで）と、ConoHa WING のベーシック 649 円のキャンペーン（10 月 7 日まで）です。#137 で、その日の公式の料金ページを確かめて書き直しました。終わったキャンペーンは過去形にして、いまのキャンペーン（それぞれ 11 月 4 日まで・10 月 22 日まで）を足し、`expires` も新しい終了日に差し替えています。エックスサーバーのタイトルやリードにあった「実質月 495 円」は、期限のない通常価格での「月 990 円から」に言い換えました。キャンペーンの値札をタイトルに置かない、という判断です。

2026-10-13 の夜の時点で、記事と比較の 20 本に 48 件が登録されていて、期限を過ぎたものはありません。次に期限が来るのは 10 月 16 日です。

## 参考

- [service-anatomy PR #134](https://github.com/tktk7l9/service-anatomy/pull/134)（expires と freshness・テストの todo）・[#137](https://github.com/tktk7l9/service-anatomy/pull/137)（期限切れ 2 件の書き直し）
- [エックスサーバーの解剖](https://serviceanatomy.com/ja/articles/xserver)・[ConoHa WING の解剖](https://serviceanatomy.com/ja/articles/conoha-wing)
