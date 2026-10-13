---
title: Next.js 7 本の CSP を Worker の nonce にして、Observatory を A+ にした
date: 2026-10-13
summary: Next.js 7 本の CSP を、Worker が HTML ごとに nonce を付ける方式に揃えて Observatory を A+ 125 にした。'strict-dynamic' を付けない理由と、nonce の信頼境界、塞いだ SVG の script href の穴。
tags: [csp, security, observatory, cloudflare-workers, nextjs]
apps: [ai-primer, elparaiso, lifeplan-simulator, housing-performance-simulator, utility-tracker, resume, ai-news-feed-app, service-anatomy]
sources:
  - https://github.com/tktk7l9/service-anatomy/pull/121
  - https://github.com/tktk7l9/service-anatomy/pull/129
  - https://github.com/tktk7l9/ai-primer/pull/68
  - https://github.com/tktk7l9/ai-primer/pull/69
  - https://github.com/tktk7l9/elparaiso/pull/54
  - https://github.com/tktk7l9/ai-news-feed-app/pull/56
  - https://developer.mozilla.org/en-US/observatory
---

[CSP を 'unsafe-inline' なしにする 3 つの方法](/blog/csp-without-unsafe-inline)の 3 つ目、Worker で毎リクエストの nonce を付ける方式を、2026-10-11 に Next.js の 7 本へ広げました。ai-primer・elparaiso・lifeplan-simulator・housing-performance-simulator・utility-tracker・resume・ai-news-feed-app です。どれも `@opennextjs/cloudflare` で Workers に載せていて、MDN HTTP Observatory は resume が B+ 80、ほかの 6 本が B 75 でした。

## 落ちていた 2 項目

減点は、`script-src` の `'unsafe-inline'`（CSP −20）と、HTML に `integrity` なしで書いた Cloudflare Web Analytics のビーコン（SRI −5。resume は外部スクリプトがなく対象外）です。素点が 90 未満だと COOP や Referrer-Policy の加点も効かないので、CSP の 20 点が全体を止めていました。

7 本とも HTML はすべて Worker が返します。ページごとに違う RSC ペイロードのハッシュを `_headers` に並べる方法は使えません。Next 16 の proxy は Node 専用で、OpenNext は Node middleware に対応していないので、Next の側で nonce を作ることもできません。ai-primer は 2026-09-12 の Workers 移行でこの理由から nonce を手放し、elparaiso は「全ルートを prerender しているので nonce は使えない」として据え置いていました。

## Worker の出口で nonce を付ける

service-anatomy の #121 と同じ形です。`wrangler.jsonc` の `main` を `worker.ts` にして `.open-next/worker.js` を包み、`text/html` の応答だけ、静的な CSP の `'unsafe-inline'` を毎リクエストの `'nonce-…'`（128 bit）に置き換えます。インラインの `<script>` には HTMLRewriter で同じ nonce を付けます。ストリームのまま書き換え、CSP ヘッダーは追加ではなく置き換えなので常に 1 本です。本文が毎回変わるので ETag と Content-Length は外します。Next の側は prerender のままです。

ビーコンは HTML の `<script src>` をやめ、ハイドレーション後に追加しました。Cloudflare が同じ URL のまま中身を差し替えるので、`integrity` は付けません。

`main` を `.open-next/worker.js` に戻すと、サイトは動いたまま黙って `'unsafe-inline'` に戻ります。`public/` に HTML を置くと、静的アセットとして Worker を通らずに返ります。どちらもテストで落ちるようにしました。

## 'strict-dynamic' は付けない

nonce を付けるのはインラインの script だけです。`'strict-dynamic'` を付けると、ブラウザは `'self'` とホストの許可を無視するので、`/_next/static` のチャンクとビーコンが止まります。外部の `<script src>` に nonce を付けないのも同じ考えで、付けると HTML に紛れ込んだ外部 script まで許してしまいます。チャンクは `'self'` で通ります。

## nonce の信頼境界と SVG の穴

HTMLRewriter には、Next 自身のインライン script と注入されたものの区別が付きません。サーバーが描画した HTML に入った `<script>` には、どれも nonce が付きます。CSP はインラインのイベントハンドラ・`javascript:` URL・後から DOM に足された script は止めますが、ここは止められません。そこで 2 つを足しました（service-anatomy #129、ai-primer #69 など）。

1 つ目は、nonce を付ける対象をインラインの JavaScript に絞ることです。`src`・`href`・`xlink:href` がなく、`type` がない・空・JavaScript の MIME タイプ・`module` のものだけに付けます。SVG の `<script>` は `src` ではなく `href` で外部スクリプトを読むので、最初の「`src` がなければ付ける」という判定では、HTML に紛れ込んだ SVG の外部 script に nonce が付き、許可リストの外から読み込めました。JSON-LD のようなデータブロックにも付けません。workerd の実際の HTMLRewriter で、属性名は大文字でも取れること、属性値の文字参照は展開されず、その場合は止める側に倒れることを確かめています。

2 つ目は、生の HTML の出口をテストで固定することです。`dangerouslySetInnerHTML` は、理由を書いた許可リストのファイル（`<` をすべてエスケープする JSON-LD と、生 HTML を落とす Markdown の出力）でしか使えません。elparaiso の許可リストは空です。ai-news-feed-app は、フィード由来の文字列に `</script><script>alert(1)</script>` や `javascript:` の URL を入れ、ニュースを出す 4 ページのサーバー HTML で要素にならないことを確かめています。

## 結果

2026-10-11 の再スキャンで、7 本とも A+ 125（12/12）になりました。CSP は `csp-implemented-with-unsafe-inline-in-style-src-only`、SRI は `sri-not-implemented-but-all-scripts-loaded-from-secure-origin` で、どちらも減点はありません。elparaiso と ai-news-feed-app は、このとき COOP（`same-origin`）も足しています。

## 参考

- [service-anatomy PR #121](https://github.com/tktk7l9/service-anatomy/pull/121)（Worker で nonce を付ける設計）・[#129](https://github.com/tktk7l9/service-anatomy/pull/129)（対象をインラインの JavaScript に絞る・信頼境界のテスト）
- [ai-primer PR #68](https://github.com/tktk7l9/ai-primer/pull/68)・[#69](https://github.com/tktk7l9/ai-primer/pull/69)、[elparaiso PR #54](https://github.com/tktk7l9/elparaiso/pull/54)、[lifeplan-simulator PR #104](https://github.com/tktk7l9/lifeplan-simulator/pull/104)・[#105](https://github.com/tktk7l9/lifeplan-simulator/pull/105)、[housing-performance-simulator PR #80](https://github.com/tktk7l9/housing-performance-simulator/pull/80)・[#83](https://github.com/tktk7l9/housing-performance-simulator/pull/83)
- [utility-tracker PR #65](https://github.com/tktk7l9/utility-tracker/pull/65)・[#66](https://github.com/tktk7l9/utility-tracker/pull/66)、[resume PR #68](https://github.com/tktk7l9/resume/pull/68)・[#70](https://github.com/tktk7l9/resume/pull/70)、[ai-news-feed-app PR #55](https://github.com/tktk7l9/ai-news-feed-app/pull/55)・[#56](https://github.com/tktk7l9/ai-news-feed-app/pull/56)
- [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory)、[MDN: script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)（'strict-dynamic' があるとホストの許可は無視される）
