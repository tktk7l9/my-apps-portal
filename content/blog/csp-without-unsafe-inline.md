---
title: CSP を 'unsafe-inline' なしにする 3 つの方法
date: 2026-10-07
summary: 静的 HTML はビルド時の sha256 を _headers に、ルール上限に収まらないページは meta タグに、Worker を通る HTML は HTMLRewriter で毎回の nonce を。3 本の Observatory を A+ 125 にした方法の選び方と、CSP が 2 本重なった失敗。
tags: [csp, security, observatory, cloudflare-workers, nextjs]
apps: [my-apps-portal, acro-finder, service-anatomy]
sources:
  - https://github.com/tktk7l9/my-apps-portal/pull/64
  - https://github.com/tktk7l9/my-apps-portal/pull/65
  - https://github.com/tktk7l9/acro-finder/pull/68
  - https://github.com/tktk7l9/service-anatomy/pull/121
  - https://developers.cloudflare.com/workers/static-assets/headers/
---

[Lighthouse と Observatory の定石](/blog/lighthouse-and-observatory-playbook)では、Next.js アプリは起動用のスクリプトがインラインなので `'unsafe-inline'` を外せない、と書きました。2026-10-06 に、このポートフォリオ・acro-finder・service-anatomy の 3 本でそれを外し、MDN HTTP Observatory は 3 本とも A+ 125（12/12）になりました。使った方法は 3 通りあります。

## どれを選ぶか

分かれ目は、その HTML を Worker が返すかどうかです。Workers の静的アセットは Worker を起動せずに返るので、リクエストごとの nonce は付けられません。

- **sha256 を `_headers` に書く**: HTML が静的アセットで、ページ数が少ないとき。このポートフォリオと、acro-finder のトップ・一覧・県ページ
- **sha256 を HTML の meta 要素に書く**: 静的アセットだが、ページが多くて `_headers` に収まらないとき。acro-finder の施設ページ 116 件
- **Worker で毎リクエストの nonce を付ける**: HTML がすべて Worker を通るとき。service-anatomy（約 2,400 ページ）

Observatory で効いていたのは CSP の −20 でした。これが残っていると素点が 90 未満になり、COOP などの加点も効きません。

## 1. ハッシュを `_headers` に書く

このポートフォリオは `/`・`/blog`・記事を静的アセットで配っています。#64 で、`scripts/export-static.mjs` が `public/` にコピーした HTML からインラインスクリプト（Next の RSC ペイロード）の sha256 を計算し、ページごとの `_headers` ルールでそのハッシュだけを許すようにしました。JSON-LD はデータブロックなので対象外です。画像やフィードなど HTML 以外のパスには、インラインを一切許さない CSP を付けます。

`_headers` は 100 ルール・1 行 2,000 文字が上限なので、ビルド時に検査して超えたら失敗させます。#65 の時点で 31 ルールでした。ハッシュを計算した後で HTML を書き換えると一致しなくなるので、コピー後の HTML には触らないと AGENTS.md に書いています。Worker が返す 404 と `/api/*` は、`next.config.ts` がビルド前に読まれてハッシュを持てないので `'unsafe-inline'` のままです。Observatory が見るのは `/` です。

## 失敗: 本番の `/` だけ CSP が 2 本になった

#64 は、`/*` に厳格な CSP を置き、ページのルールで `! Content-Security-Policy` により外してからハッシュ版を付ける方式でした。`wrangler dev` では期待どおりでしたが、本番のエッジでは `/` だけ外れず、厳格版とハッシュ版の 2 本が返りました。CSP が複数あるとブラウザはすべてを適用するので、`/` の RSC ペイロードがブロックされ、ハイドレーションが止まりました。`/blog` と記事は 1 本で正常でした。

#65 で `/*` から CSP をなくし、HTML はハッシュ版、それ以外は厳格版を、パスごとに 1 本のルールで付ける形にしました。切り離しの挙動に頼らない形です。acro-finder は最初からこの形にし、`/*` とほかのルールが同じヘッダー名を持たないこともビルドで検査しています。

## 2. ハッシュを HTML の meta 要素に書く

acro-finder の施設ページ 116 件は、1 件 1 ルールだと 100 ルールを超え、1 ルールにまとめると 1 行 2,000 文字を超えます。そこで #68 では、各 HTML の `<meta http-equiv="Content-Security-Policy">` にハッシュ付きの方針を入れ、ヘッダー側（`/facilities/:id` の 1 ルール）は `'unsafe-inline'` と `frame-ancestors` のままにしました。ブラウザは両方を適用するので、実効はハッシュだけになります。`frame-ancestors` は `<meta>` では使えないので、ヘッダーに残す必要があります。`_headers` は 44 ルール、最長 500 文字に収まりました。

## 3. Worker で nonce を付ける

service-anatomy は HTML がすべて Worker を通ります。約 2,400 ページ分のハッシュは `_headers` に収まらない（`img-src` だけで 2,000 文字を超える）ので、#121 で `wrangler.jsonc` の `main` を `worker.ts` にして `.open-next/worker.js` を包みました。`text/html` の応答だけ、`script-src` の `'unsafe-inline'` を毎リクエストの `'nonce-…'`（128 bit）に置き換え、インラインの `<script>` に HTMLRewriter で同じ nonce を付けます。ストリームのまま書き換えるのでバッファしません。本文がリクエストごとに変わるので ETag と Content-Length は外し、CSP ヘッダーは置き換えで常に 1 本です。

このポートフォリオでも 10 月 5 日に Next の proxy（OpenNext では experimental な Node middleware）で nonce を試しましたが、CPU 上限超過（1102）が増えて戻しました（#54）。そのとき次の手として残したのが「middleware を使わず、worker.js のラッパーで HTML に nonce を注入する」で、service-anatomy の #121 はちょうどその形です。

## ビーコンの SRI

もう 1 つの減点は SRI の −5 でした。Cloudflare Web Analytics のビーコンは同じ URL のまま中身が差し替わるので、`integrity` を固定できません。3 本とも HTML の `<script src>` をやめ、ハイドレーション後に追加する形にしました。acro-finder はこれで A+ 120 から 125 になりました（#69）。

## 結果

- このポートフォリオ: B 75（10/12）→ A+ 125（12/12）
- acro-finder: B 75（10/12）→ A+ 125（12/12）
- service-anatomy: B+ 80（11/12）→ A+ 125（12/12）

`style-src` の `'unsafe-inline'` は 3 本とも残っていますが、Observatory は style-src だけの場合を減点しません（`csp-implemented-with-unsafe-inline-in-style-src-only`）。デプロイ後は、本番の各パスで CSP ヘッダーが 1 本であることを curl で数えています。

## 参考

- [my-apps-portal PR #64](https://github.com/tktk7l9/my-apps-portal/pull/64)・[#65](https://github.com/tktk7l9/my-apps-portal/pull/65)（ハッシュ方式と、CSP が 2 本になった件の修正）、[#54](https://github.com/tktk7l9/my-apps-portal/pull/54)（nonce CSP を戻した理由）、[#67](https://github.com/tktk7l9/my-apps-portal/pull/67)・[#70](https://github.com/tktk7l9/my-apps-portal/pull/70)・[#71](https://github.com/tktk7l9/my-apps-portal/pull/71)（Observatory の記録）、[AGENTS.md](https://github.com/tktk7l9/my-apps-portal/blob/main/AGENTS.md)
- [acro-finder PR #68](https://github.com/tktk7l9/acro-finder/pull/68)・[#69](https://github.com/tktk7l9/acro-finder/pull/69)
- [service-anatomy PR #121](https://github.com/tktk7l9/service-anatomy/pull/121)・[#122](https://github.com/tktk7l9/service-anatomy/pull/122)、[#118](https://github.com/tktk7l9/service-anatomy/pull/118)（ビーコン）
- [Cloudflare Workers: Headers](https://developers.cloudflare.com/workers/static-assets/headers/)（100 ルール・1 行 2,000 文字・`!` による切り離し）
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)（複数の方針はすべて適用される）、[frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
