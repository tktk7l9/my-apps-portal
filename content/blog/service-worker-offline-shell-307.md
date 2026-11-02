---
title: /index.html の 307 でオフラインのシェルが空振りしていた — Service Worker のキャッシュキー
date: 2026-11-02
summary: Workers の静的アセットは /index.html を 307 で / に転送する。これをそのまま precache すると転送済みの応答が保存され、ナビゲーションには使えない。PWA 4 本のシェルのキーを / に揃え、sw.js に初めてテストを付けた。
tags: [service-worker, pwa, cloudflare-workers, testing]
apps: [skydial, css-atelier, snippet-sprint, lumen-bloom]
sources:
  - https://github.com/tktk7l9/skydial/pull/36
  - https://github.com/tktk7l9/css-atelier/pull/60
  - https://github.com/tktk7l9/snippet-sprint/pull/48
  - https://github.com/tktk7l9/lumen-bloom/pull/38
---

2026-10-26 のセキュリティ・堅牢性レビューで、PWA の 4 本に同じ不具合が見つかりました。「インストールした直後にオフラインになると、シェルが出ない」というものです。オンラインで 1 回でもページを開けば直ってしまうので、普段の確認では見えません。

## なぜ空振りするのか

順番に追うと次のようになります。

1. Workers の静的アセットは `/index.html` に `307 → /` を返す（`curl -I` で確認）
2. install 時の `cache.addAll(["/", "/index.html", ...])` は転送を追い、`redirected: true` の応答を `/index.html` のキーに保存する
3. ナビゲーションのリクエストは redirect mode が `manual`。ブラウザは、ここに転送済みの応答を使うことを拒否する
4. オフラインの代替表示がネットワークエラーになる

Chrome のエラーは "a redirected response was used for a request whose redirect mode is not 'follow'" です。

新しいワーカーがインストールされるたび（つまりデプロイごと）にこの状態に戻り、次にオンラインで開いて上書きされるまで続きます。

## 直し方

シェルのキーを `/` に統一しました。`/` は転送されません。precache、ナビゲーション成功時の保存、オフライン時の代替の 3 か所を、同じ定数に揃えています。

snippet-sprint では、保存の条件を `res.ok && !res.redirected` の 1 か所にまとめました。4xx/5xx、opaque、転送済みの応答はどれも保存しません。キャッシュ名も上げて（snippet-sprint は v2、lumen-bloom は v3）、古い `/index.html` のエントリを activate で捨てます。

もう 1 つ、skydial と snippet-sprint では `cache.put()` が `event.waitUntil` の外にあり、応答の直後にワーカーが止められると書き込みが途中で終わることがありました。これも `waitUntil` に乗せています。glsl-atelier のシェルは既に `/` だったので、[#55](https://github.com/tktk7l9/glsl-atelier/pull/55) では `waitUntil` だけを直しました。

## sw.js にテストを付ける

この不具合が長く残ったのは、`sw.js` にテストが無かったからです。Service Worker はブラウザの中でしか動かないと思いがちですが、依存しているのは `self`・`caches`・`fetch` だけです。小さな偽物を用意すれば、Vitest の上でそのまま動かせます。

固定した振る舞いは次のとおりです。

- シェルを `/` で precache し、`/index.html` を取りに行かない
- ナビゲーションは network-first で、404・5xx・転送の応答がシェルを置き換えない
- オフライン時はシェルを返す
- 資産は 2xx だけを保存する
- 他のオリジンと GET 以外には触らない
- activate で古いキャッシュを消す

skydial と css-atelier では、これらのテストが修正前の `sw.js` で落ちることを確かめています。

css-atelier の `sw.js` は Vite のテンプレートなので、`?raw` で読み込んで偽の Cache API の上で実行しました。ビルドの仕組みが違っても、ファイルを文字列として読めばテストの形は同じです。

## ついでに分かったこと

レビューの中で、wrangler 4.153.0 に上げると miniflare 経由の undici の勧告 3 件が消えることも確認しました。どれも開発時の依存で、`--omit=dev` では最初から 0 件でした。

lumen-bloom は同じ PR で、天気取得に 10 秒のタイムアウトと 64 KB の本文上限も入れています。こちらは[タイムアウトの記事](/blog/timeouts-on-every-external-call)にまとめました。

## 参考

- [skydial PR #36](https://github.com/tktk7l9/skydial/pull/36)・[css-atelier PR #60](https://github.com/tktk7l9/css-atelier/pull/60)・[snippet-sprint PR #48](https://github.com/tktk7l9/snippet-sprint/pull/48)・[lumen-bloom PR #38](https://github.com/tktk7l9/lumen-bloom/pull/38)
- [glsl-atelier PR #55](https://github.com/tktk7l9/glsl-atelier/pull/55)（`waitUntil`）
- 関連: [Vercel から Workers への移行の記事](/blog/vercel-to-cloudflare-workers)
