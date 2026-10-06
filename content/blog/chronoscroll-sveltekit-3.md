---
title: chronoscroll を SvelteKit 3 へ上げた記録
date: 2026-10-07
summary: Dependabot の更新 PR では通らなかった 2 つの理由（tsconfig の $app/tsconfig と古い cookie の override）、移行ツールの差分を全部読んだ理由、R2 に置く 27,453 ページのファイル名が変わらないことの確かめ方。
tags: [sveltekit, chronoscroll, migration, dependabot]
apps: [chronoscroll]
sources:
  - https://github.com/tktk7l9/chronoscroll/pull/52
  - https://github.com/tktk7l9/chronoscroll/pull/51
  - https://github.com/tktk7l9/chronoscroll/pull/53
  - https://svelte.dev/docs/kit/migrating-to-sveltekit-3
---

[chronoscroll](https://chronoscroll.saitotakuya0719.workers.dev) は Svelte 5 + SvelteKit（adapter-static）の年表サイトで、イベント個別ページだけを R2 から配っています（[R2 + Worker の記事](/blog/chronoscroll-r2-worker-hybrid)）。2026-10-06 に `@sveltejs/kit` を 2.70 から 3.0.1 へ、`@sveltejs/adapter-static` を 3 から 4.0.0 へ上げました（#52）。

## Dependabot の PR のままでは通らなかった 2 つの理由

先に Dependabot が npm-major グループの PR（#49・#51）を開きましたが、CI が落ちたので閉じ、公式の移行手順で上げ直しました。そのままでは通らない理由が 2 つありました。

1. **tsconfig**: `extends` が `./.svelte-kit/tsconfig.json` のままで、`svelte-check` がそれを読めませんでした（`tsconfig_extends_missing`）。SvelteKit 3 では `$app/tsconfig` を継承します。CI が落ちていたのはこのためです
2. **cookie の override**: kit 2 経由で cookie の勧告（low 3 件）が出るのを避けるため、`overrides.cookie: ^0.7.2` で固定していました。SvelteKit 3 は `cookie@^2` の `parseCookie` を使うので、この固定があると prerender の「Analysing routes」で `Named export 'parseCookie' not found` になります。外した後の依存ツリーは cookie 2.0.1（kit）と 1.1.1（wrangler 経由）で、`npm audit` は 0 件でした

どちらも依存の版を上げるだけでは直らない変更で、Dependabot の PR の中では解決できません。

## 移行ツールの差分は全部読む

`npx sv migrate sveltekit-3 --tasks all` が入れた変更は次のとおりです。Node 22.17・TypeScript 6・Svelte 5.57.1・Vite 8.0.12 以上という前提はもう満たしていたので、ほかの依存は上げていません。

- tsconfig の `extends` を `$app/tsconfig` にし、そちらが持つ設定は tsconfig から削除
- `$lib/...` を `#lib/...`（package.json の `imports` による subpath imports）にし、拡張子 `.js` を付ける
- `$app/environment` を `$app/env` に

ツールは `+page.svelte` と `ThemeToggle.svelte` に Prettier 風の整形（括弧や改行）も一緒に入れていたので、それは戻して必要な変更だけを手で当てました。出力された `MIGRATION_TASKS.md` も読み、該当なしを確かめてから削除しています。

挙動の変更は 1 つです。SvelteKit 3 では `replaceState` が非推奨なので、URL の同期を `goto(url, { shallow: true, replace: true })` に変えました。shallow な遷移でも `afterNavigate` が呼ばれるようになったため、`afterNavigate` の中で `shallow` のときは何もしないようにしています。

## 27,453 ページのファイル名が変わらないこと

いちばん気にしたのは R2 です。`/e/<id>` のページはビルド後に `build-e/` へ分け、`scripts/r2-sync.mjs` が差分を同期します。移行でファイル名や置き場所が変わると、全件の削除と再アップロードになりかねません。

そこで main のビルドと比べました。`build-e/` は 27,453 本で、ファイル名は完全に一致し、大量削除の安全弁が反応するような削除は起きません。`build/` は 95 ファイルで、main の 92 との差はチャンク 2 本と payload 1 本でした。

もう 1 つ、厳格な CSP のために SvelteKit のルートアナウンサーの `style` 属性を sha256 で許可しています。この文字列が変わると本番でアナウンサーが CSP 違反になるので比べましたが、main と完全に同じでハッシュの更新は不要でした。確認は `svelte-check` 512 ファイルでエラー 0、テスト 502 件、本番と同じ CSP で配るスモーク 63/63 です。本番の `sitemap.xml` にも `/e/` の URL が 27,453 件載っています。

## 参考

- [chronoscroll PR #52](https://github.com/tktk7l9/chronoscroll/pull/52)（移行の手順と確認）、[#51](https://github.com/tktk7l9/chronoscroll/pull/51)・[#49](https://github.com/tktk7l9/chronoscroll/pull/49)（閉じた Dependabot の PR）、[#30](https://github.com/tktk7l9/chronoscroll/pull/30)（cookie の override を残していた理由）、[#53](https://github.com/tktk7l9/chronoscroll/pull/53)（README の件数）
- [chronoscroll の AGENTS.md](https://github.com/tktk7l9/chronoscroll/blob/main/AGENTS.md)（R2 への分割と CSP の注意点）
- [本番の sitemap.xml](https://chronoscroll.saitotakuya0719.workers.dev/sitemap.xml)（2026-10-07 に `/e/` の URL を数えた）
- [Migrating to SvelteKit v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)
