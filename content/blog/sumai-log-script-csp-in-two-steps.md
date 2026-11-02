---
title: スクリプトの CSP を 2 段階で本適用する — TanStack Start と zod と Google マップ
date: 2026-11-02
summary: script-src の無かった sumai-log に、毎リクエストの nonce と Report-Only で CSP を入れ、5 日間違反 0 件を確かめて本適用した。zod の eval の試し、Google マップの nonce、ワイルドカードを入れなかった理由をまとめる。
tags: [sumai-log, security, csp, tanstack-start, cloudflare-workers]
apps: [sumai-log]
sources:
  - https://github.com/tktk7l9/sumai-log/pull/81
  - https://github.com/tktk7l9/sumai-log/pull/86
---

[sumai-log](/?work=sumai-log) の CSP には `script-src` がありませんでした。生の HTML の出口は無く、React がすべてエスケープするので実害は低いのですが、多層防御としてスクリプトを絞ることにしました。Google マップと WebGL の 3D を使う画面があり、方針の誤りは画面の破損に直結します。そこで 2 段階で入れました。

| 段階 | 送るヘッダー | ブラウザの動き |
|---|---|---|
| 1（[#81](https://github.com/tktk7l9/sumai-log/pull/81)・10/14） | 既存の CSP + `content-security-policy-report-only` | 止めずに、コンソールへ報告だけ |
| 2（[#86](https://github.com/tktk7l9/sumai-log/pull/86)・10/19） | CSP に統合し、report-only は送らない | 許可外を止める |

第 2 段階は `SCRIPT_POLICY_MODE` の 1 行です。`'report-only'` は戻し口として残してあります。

## Worker の入口で nonce を付ける

HTML の応答ごとに 128 bit の nonce を作り、HTMLRewriter でインラインの JavaScript の `<script>` だけに付けます。`src` 付きの script や `application/json` のデータブロックには付けません。ストリーミングのまま処理し、本文が毎回変わるので `etag` と `content-length` は外します。JSON の server function、写真、静的アセットには触りません。

service-anatomy で先に作った型（[nonce の記事](/blog/nonce-csp-seven-nextjs-apps)）を、TanStack Start の Worker に移した形です。テストは偽の rewriter に加えて、workerd の本物の HTMLRewriter でも行い、7 バイトずつに切ったストリームでも nonce 属性以外が 1 バイトも変わらないことを確かめました。

方針は次のとおりです。

```
script-src 'self' 'nonce-…' 'wasm-unsafe-eval'
  https://maps.googleapis.com https://static.cloudflareinsights.com;
worker-src blob:
```

## zod が全ページで違反していた

実測で最初に出たのは、自分のコードではなく zod でした。zod v4 は最初のオブジェクトスキーマを作るときに `new Function('')` を試すので、全ページで違反になります。

`z.config()` をモジュールの中で呼ぶ方法は間に合いませんでした。スキーマを作る共有チャンクがエントリーより先に走るためです。そこで `globalThis.__zod_globalConfig` に `jitless` を置く 1 行のスクリプトを、`<head>` の先頭に `ScriptOnce` で入れました。

TanStack の `head().scripts` は使えませんでした。クライアントが `nonce` 属性を見て重複を探しますが、ブラウザは nonce 属性を空にするので、nonce の無い 2 本目が足されてしまいます。

## 許可したものと、入れなかったもの

- **`'wasm-unsafe-eval'` と `worker-src blob:`**: ベクター地図で `webgl.js` が blob: の Worker を作り、WebAssembly をコンパイルする。Google の文書は `'unsafe-eval'` だが、必要なのは WebAssembly だけなので `eval()` は止めたままにした
- **`https://static.cloudflareinsights.com`**: ビーコンは Worker の後で挿入されて nonce を持たないので、ホストで許可する
- **`'strict-dynamic'` は入れない**: ホストの許可が無視され、nonce の無いビーコンが止まる
- **Google が挙げるワイルドカードは入れない**: `*.googleapis.com` などは誰でもファイルを置ける場所を含み、注入されたマークアップからスクリプトを読めてしまう

Google マップのローダーは、ページ最初の `script[nonce]` から nonce を写します。`maps.googleapis.com` の許可は nonce だけで通ることを確かめたうえで、保険として残しています。

## 本適用の前に確かめたこと

ヘッドレス Chrome で全画面と主な操作を回し、`securitypolicyviolation` イベントを Worker 内の分まで集めました。デスクトップとモバイルの各 29 手順で違反 0、例外 0 です。一時的に `'enforce'` にしたビルドの予行も同じ結果でした。

そのうえで本番を Report-Only のまま 5 日間使い、`[Report Only]` の違反が 0 件なのを確かめて切り替えました。

あわせて信頼境界のガードテストも置きました。`dangerouslySetInnerHTML` や `innerHTML` などの出口は許可リスト（空）の外で失敗し、`<script>` を書く手段は `__root.tsx` の定数 2 つだけに限ります。判定は AST で行うので、コメントや文字列には反応しません。コンポーネントに `innerHTML` を足すと実際に落ちることも確認しました。

## 参考

- [sumai-log PR #81](https://github.com/tktk7l9/sumai-log/pull/81)（nonce と Report-Only）・[#86](https://github.com/tktk7l9/sumai-log/pull/86)（本適用）
- 関連: [nonce の記事](/blog/nonce-csp-seven-nextjs-apps)、[unsafe-inline を外した記事](/blog/csp-without-unsafe-inline)
