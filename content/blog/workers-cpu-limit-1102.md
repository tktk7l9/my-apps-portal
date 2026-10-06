---
title: 無料プランの Worker が CPU 上限（1102）で 503 を返した話
date: 2026-10-07
summary: Next.js を OpenNext で載せたこのポートフォリオと acro-finder が、Workers 無料プランの CPU 上限で 503 を返した。原因の調べ方と、ページを静的アセットにして Worker を起動させない直し方、staticAssetsIncrementalCache の役目。
tags: [cloudflare-workers, opennext, nextjs, static-site]
apps: [my-apps-portal, acro-finder]
sources:
  - https://github.com/tktk7l9/my-apps-portal/pull/55
  - https://github.com/tktk7l9/my-apps-portal/pull/54
  - https://github.com/tktk7l9/acro-finder/pull/68
  - https://developers.cloudflare.com/workers/platform/limits/
  - https://opennext.js.org/cloudflare/caching
---

Workers の無料プランでは、HTTP リクエスト 1 回あたりの CPU 時間の上限が 10 ms です。超えると Cloudflare は Error 1102（Worker exceeded resource limits）を返し、利用者には 503 に見えます。2026-10-05〜06 に、Next.js を `@opennextjs/cloudflare` で載せている 2 本がこれに当たりました。直し方はどちらも「Worker を起動させない」です。

## ポートフォリオ: 毎回描画し、毎回画像を作っていた

このポートフォリオは、`/` をリクエストのたびに描画していました。OpenNext のキャッシュを設定しておらず毎回 MISS で、CPU は約 300〜860ms です。アイキャッチの `/api/og/*` は毎回 ImageResponse で画像を作り、約 500〜1400ms かかっていました。本番で各 30 回叩くと、`/` は 0 回、`/api/og/roba-hud` は 6 回、`/api/og/agent-cockpit` は 24 回が 503 でした。

その少し前の 10 月 5 日には、nonce の CSP のために Next の proxy（OpenNext では experimental な Node middleware）を入れて、かえって悪化させています。`/api/og/roba-hud` は 15 回中 11 回が 503 になり、Workers Observability の `exceededCpu` は新しい版だけに 13 件出たので、その日のうちに戻しました（#54）。

#55 では、`next build` が事前生成した `/`・`/icon.svg`・`/opengraph-image`・アイキャッチの PNG を `scripts/export-static.mjs` が `public/` にコピーし、静的アセットとして配るようにしました。`/api/og/[id]` は `generateStaticParams` と `force-static` でビルド時に作ります。ローカルの `wrangler dev` では、これらは Worker を通らず 1〜3ms で返りました（変更前は `/api/og/roba-hud` が 543ms）。

## acro-finder: 動的なルートが 2 つ残っていた

acro-finder は、本番で Lighthouse とブラウザ確認を数回続けただけで `/facilities/f01`・`/area/tokyo`・`/facilities` が 503 になりました（#68）。Workers Observability では直近 24 時間に `Worker exceeded CPU time limit.` が 10 件で、HTML もアイコンも manifest も、すべてのリクエストが Worker を通っていました。

`next build` の表を見ると、`/facilities/[id]` と `/area/[pref]` が Dynamic でした。`generateStaticParams` がなく、リクエストのたびに描画していたためです。ほかのページは Static でも、OpenNext では Worker が返すので CPU を使います。`generateStaticParams` と `dynamicParams = false` を足し、ポートフォリオの `export-static.mjs` を移植して全ページを静的アセットにしました。問い合わせフォームの Server Action を受ける `/owners` だけは Worker に残しています。

デプロイ後に 4 つのパスへ各 30 回（200ms 間隔）リクエストし、120 回すべて 200 でした。同じ時間帯の Observability で Worker が動いたのは `/owners` だけです。

## なぜ静的アセットなら止まらないのか

静的アセットを持つ Worker では、リクエストに一致するアセットがあれば Cloudflare がそれを先に返し、一致しないときだけ Worker を起動します。静的アセットへのリクエストは無料・無制限で、Worker の CPU 時間を消費しません。

OpenNext 側では `open-next.config.ts` に `incrementalCache: staticAssetsIncrementalCache` を指定しています。ビルド時の値を静的アセットから読む読み取り専用のキャッシュで、再検証はできません。これがないと、静的アセットにコピーしていない経路で Worker が事前生成ページを返せず、静的生成した動的セグメントが 404 になります。

## 静的にすると変わること

- データの鮮度はビルド時点になる。ポートフォリオは GitHub Actions の `rebuild.yml` が 3 時間ごとに Deploy Hook を叩いて再ビルドし、誰でも押せた「更新」ボタンはやめて取得日時の表示にした
- `next.config.ts` の `headers()` は静的アセットに付かない。同じヘッダーを `public/_headers` に書き出す（CSP は [CSP の記事](/blog/csp-without-unsafe-inline)）
- 内部リンクは `next/link` ではなく `<a>` にする。静的アセットはクエリを見ないので、RSC のプリフェッチにも HTML が返るため
- これらのルートを動的に戻さないことを AGENTS.md に書いた

## 参考

- [my-apps-portal PR #55](https://github.com/tktk7l9/my-apps-portal/pull/55)（静的アセット化）・[#54](https://github.com/tktk7l9/my-apps-portal/pull/54)（nonce CSP を戻した理由）、[AGENTS.md](https://github.com/tktk7l9/my-apps-portal/blob/main/AGENTS.md)
- [acro-finder PR #68](https://github.com/tktk7l9/acro-finder/pull/68)（デプロイ後の確認はコメント）
- Cloudflare Docs: [Limits](https://developers.cloudflare.com/workers/platform/limits/)（CPU 時間と Error 1102）、[Worker script](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)（アセットが先に返る）、[Pricing](https://developers.cloudflare.com/workers/platform/pricing/)（静的アセットは無料・無制限）
- [OpenNext: Caching](https://opennext.js.org/cloudflare/caching)（Static Assets incremental cache）
