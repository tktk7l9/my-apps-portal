---
title: CDN 向けの s-maxage がブラウザに届いていた — デプロイ後に消えたチャンクを読みに行く
date: 2026-11-02
summary: Vercel が書き換えていた Cache-Control が Workers ではそのままブラウザに届き、デプロイ後に古い RSC が消えたチャンクを読みに行って画面が崩れた。Worker のラッパーで書き換え、Next.js の 8 本に同じ修正を入れた。
tags: [cloudflare-workers, nextjs, opennext, cache]
apps: [resume, ai-primer, utility-tracker, elparaiso, ai-news-feed-app, lifeplan-simulator, service-anatomy, housing-performance-simulator]
sources:
  - https://github.com/tktk7l9/resume/pull/80
  - https://github.com/tktk7l9/ai-primer/pull/90
  - https://github.com/tktk7l9/utility-tracker/pull/71
  - https://github.com/tktk7l9/elparaiso/pull/60
  - https://github.com/tktk7l9/ai-news-feed-app/pull/62
  - https://github.com/tktk7l9/housing-performance-simulator/pull/94
---

Vercel から Cloudflare Workers へ移したあとも、しばらく残っていた差の話です。プラットフォームが黙って書き換えていたヘッダーは、移行しても設定に現れないので見落としやすいものでした。

## 症状

デプロイの直後にページを開くと、もう存在しない `/_next/static/chunks/*.css|*.js` を読みに行って 404 になり、コンソールに次のようなエラーが出ました（2026-10-20 に resume の本番で確認）。

```
Refused to apply style ... MIME type ('text/plain')
Refused to execute script ...
```

スタイルが当たらなくなるほか、クライアント側の画面遷移も同じ理由で壊れることがあります。

## 原因

Next.js は事前生成したページと、その RSC ペイロード（ルーターが先読みと遷移で取りに行く `?_rsc=`）に次のヘッダーを付けます。

```
cache-control: s-maxage=31536000, stale-while-revalidate=2592000
```

これは CDN 向けの値です。Vercel はブラウザへ渡す前に `public, max-age=0, must-revalidate` へ書き換えますが、Workers ではそのまま届きます。

ブラウザは `s-maxage` を無視する一方で `stale-while-revalidate` には従うので、RSC ペイロードを最大 30 日ディスクキャッシュから返し、裏で再検証します。CDP で測ると、2 回目の読み込みは `fromDiskCache: true` でした。デプロイ後はその古いペイロードが旧ビルドのチャンク名を指しているため、404 になります。

housing-performance-simulator のように `s-maxage` だけが付く場合にも別の問題があります。途中に共有キャッシュがあると、毎リクエストの nonce が入った HTML を 1 年保持できてしまいます。

## 直し方

Worker のラッパーに小さな純関数を足しました。

- `browserCacheControl(value)`: `s-maxage` ディレクティブを含む値だけを `public, max-age=0, must-revalidate` にする。判定はディレクティブ名として見る（`/(^|,)\s*s-maxage\s*=/i`）ので、名前が `s-maxage` で終わる別のディレクティブには反応しない
- `applyBrowserCacheControl(response)`: 値が変わるときだけ応答を作り直す。`fetch()` 由来の応答はヘッダーが書き換えられないので、元の応答には触らない。Cache-Control の無い応答には足さない

これを OpenNext が返すすべての応答（HTML、`text/x-component` の RSC、route handler、リダイレクト）に、nonce の処理の前に通します。HTML だけでは足りません。問題の本体は RSC 側だからです。

`/_next/static/*` は Worker より前に Workers Assets が返すので、`immutable` のままです。404 の `private, no-cache, no-store, ...` も変わりません。つまりファイル名にハッシュが付いたものは長く持ち、それを指す側は毎回確かめる、という形に戻しただけです。

## 確かめたこと

`opennextjs-cloudflare build` → `preview` で、修正の前後のヘッダーを curl で比べました（GET のみ）。

| リクエスト | 前 | 後 |
|---|---|---|
| HTML | `s-maxage=31536000, stale-while-revalidate=2592000` | `public, max-age=0, must-revalidate` |
| RSC（`RSC: 1`） | 同上 | `public, max-age=0, must-revalidate` |
| `/_next/static/chunks/*` | `immutable` | 変わらず |
| 404 | `private, no-cache, no-store, ...` | 変わらず |

テストは「修正を外すと落ちる」ことも確認しています。elparaiso では全 8 ページの HTML と RSC の計 16 件が同じ値になりました。既にブラウザに残っている古いエントリは、次に使われたときの裏の再検証で置き換わるので、そこまでは旧挙動が 1 回残ることがあります。

## 8 本への展開

10/20 に resume #80、ai-primer #90、utility-tracker #71、elparaiso #60、ai-news-feed-app #62 が入り、lifeplan-simulator #112 と service-anatomy #146 もキャッシュ割り込みの導入と一緒に同じ書き換えを持ちました。housing-performance-simulator だけ漏れていて、10/26 のセキュリティレビューで見つかり #94 で直しました。横展開は「一度に全部やったつもり」が一番漏れます。今はこの 8 本すべてに入っています。

## 参考

- [resume PR #80](https://github.com/tktk7l9/resume/pull/80)・[ai-primer PR #90](https://github.com/tktk7l9/ai-primer/pull/90)・[utility-tracker PR #71](https://github.com/tktk7l9/utility-tracker/pull/71)・[elparaiso PR #60](https://github.com/tktk7l9/elparaiso/pull/60)・[ai-news-feed-app PR #62](https://github.com/tktk7l9/ai-news-feed-app/pull/62)・[housing-performance-simulator PR #94](https://github.com/tktk7l9/housing-performance-simulator/pull/94)
- 関連: [Vercel から Workers への移行の記事](/blog/vercel-to-cloudflare-workers)、[incrementalCache の記事](/blog/opennext-incremental-cache-1102)
