---
title: 事前生成したページを毎回描き直していた — OpenNext の incrementalCache と 1102
date: 2026-10-11
summary: OpenNext で載せた Next.js 6 本が incrementalCache を設定しておらず、事前生成したページをリクエストごとに描画し直していた。ai-primer ではプリフェッチの一斉リクエストで CPU 上限（1102）に当たった。直し方と、キャッシュで出た 404 の言語の罠。
tags: [cloudflare-workers, opennext, nextjs, performance]
apps: [ai-primer, elparaiso, resume, utility-tracker, lifeplan-simulator, housing-performance-simulator]
sources:
  - https://github.com/tktk7l9/ai-primer/pull/70
  - https://github.com/tktk7l9/elparaiso/pull/55
  - https://github.com/tktk7l9/resume/pull/69
  - https://github.com/tktk7l9/utility-tracker/pull/67
  - https://github.com/tktk7l9/lifeplan-simulator/pull/106
  - https://github.com/tktk7l9/housing-performance-simulator/pull/82
  - https://opennext.js.org/cloudflare/caching
---

[1102 の記事](/blog/workers-cpu-limit-1102)では、ページを静的アセットにして Worker を起動させないことで CPU 上限を避けました。[nonce の記事](/blog/nonce-csp-seven-nextjs-apps)の 7 本は HTML に毎回 nonce を付けるので、HTML は Worker を通す必要があります。そのうち 6 本で、Worker が事前生成したはずのページを毎回描き直していました。

## ai-primer の 1102

2026-10-11、ai-primer のレッスンページを開くと、ときどきエラー 1102（503）が返りました。再現させると、旧版で 61 件中 13 件、nonce を入れた #68 の版で 124 件中 8 件が `exceededResources` でした。

`open-next.config.ts` が引数なしの `defineCloudflareConfig()` で、incremental cache が既定のダミーのままでした。Worker はビルド時に生成したページをどこからも読めず、リクエストのたびに React で描画していました。本番の応答はすべて `x-nextjs-cache: MISS` で、CPU 時間の中央値は 25〜50 ms です。レッスンページには画面内のリンクが 12 本あり、next/link のプリフェッチが同時に 12 本飛んで、それぞれが描画を走らせます。まとめて来ると上限に当たります。

## ほかの 5 本も同じだった

elparaiso・resume・utility-tracker・lifeplan-simulator・housing-performance-simulator も同じ設定でした。各 PR に書いた、直す前の本番の CPU 時間です（直近 7 日の値は、トラフィックが少ないので起動直後の重い処理も含みます）。

| アプリ | CPU 時間（直す前） |
|---|---|
| elparaiso | 中央値 215 ms・p90 395 ms（直近 7 日） |
| resume | 中央値 225 ms・p90 480 ms（直近 7 日） |
| utility-tracker | 中央値 81 ms・p90 345 ms（直近 7 日） |
| housing-performance-simulator | p50 42 ms・p90 246 ms（63 リクエスト） |
| lifeplan-simulator | p90 約 300 ms |

resume の設定ファイルには「SSG なのでダミーで十分」というコメントがありましたが、ダミーでは SSG の成果物を配れません。

## staticAssetsIncrementalCache にする

6 本とも `incrementalCache: staticAssetsIncrementalCache` にしました。ai-primer・elparaiso・resume・utility-tracker は `enableCacheInterception: true` も付けています。ビルドの出力は `cdn-cgi/_next_cache/` に置かれ、ASSETS バインディング経由で Worker からだけ読めます。インターセプトを有効にすると、キャッシュ済みのルートは Next のサーバーを読み込まずに返ります。読み取り専用のキャッシュなので再検証（ISR）はできませんが、6 本とも ISR は使っていません。

動的なものは今までどおり Next に届きます。housing の `/share/[token]`、lifeplan の `/api/evaluate`、resume の問い合わせの Server Action（POST）です。HTML は相変わらず `worker.ts` を通るので、キャッシュから返した HTML でも nonce はリクエストごとに変わります。設定を戻してもサイトは動き続けて気づけないので、`open-next.config.ts` の中身はテストで固定しました。

## キャッシュで出た 404 の言語の罠

ai-primer では、キャッシュが効くと `/en/...` の 404 が日本語で返り、React の水和不一致（error 418）が出ました。ビルド時に 1 回だけ（日本語で）生成されたルートの not-found が、そのまま返るようになったためです。ロケール配下でどのルートにも当たらない URL を受ける `[locale]/[...rest]` を足し、404 をリクエストごとに URL の言語で描画するようにしました。ルートの not-found を動的にする案は、全ページが動的になるので採っていません。

## 結果

ローカルのプレビューでは、ai-primer・elparaiso・resume の一斉リクエスト（文書とプリフェッチで計 61 件）がすべて 200 でキャッシュの HIT でした。2026-10-11 に本番の各ページを GET すると、6 本ともキャッシュの HIT（`x-opennext-cache` か `x-nextjs-cache`）が返ります。ai-primer の README では、サーバー応答は 40〜80 ms です。

同じ日に、lifeplan と housing の `/simulator` は初回の JS も削りました。zod と 2 ステップ目以降（lifeplan）、グラフのライブラリと 2 ステップ目以降（housing）を分割し、表示後のアイドル時に先読みします。gzip で約 325 KB から約 218 KB、約 331 KB から約 203 KB です（どちらもローカルのビルド）。

## 参考

- [ai-primer PR #70](https://github.com/tktk7l9/ai-primer/pull/70)（1102 の再現・404 の言語）、[elparaiso PR #55](https://github.com/tktk7l9/elparaiso/pull/55)、[resume PR #69](https://github.com/tktk7l9/resume/pull/69)、[utility-tracker PR #67](https://github.com/tktk7l9/utility-tracker/pull/67)
- [lifeplan-simulator PR #106](https://github.com/tktk7l9/lifeplan-simulator/pull/106)、[housing-performance-simulator PR #82](https://github.com/tktk7l9/housing-performance-simulator/pull/82)・[#84](https://github.com/tktk7l9/housing-performance-simulator/pull/84)（キャッシュと `/simulator` の分割）
- [ai-primer の README](https://github.com/tktk7l9/ai-primer#readme)
- [OpenNext: Caching](https://opennext.js.org/cloudflare/caching)、[Cloudflare Workers: Limits](https://developers.cloudflare.com/workers/platform/limits/)
