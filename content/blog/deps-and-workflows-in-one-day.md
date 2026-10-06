---
title: 公開 24 リポジトリの依存とワークフローを一日で揃えた話
date: 2026-10-07
summary: 2026-10-06 に source-map-js の勧告が全 lockfile に同時に当たった日の対応と、GitHub Actions のコミット SHA 固定、Dependabot の Actions 更新 PR 49 本の処理とグループ化、自動マージを minor/patch に限っている理由。
tags: [dependabot, github-actions, ci, security]
apps: [my-apps-portal, service-anatomy, ai-primer, acro-finder, chronoscroll]
sources:
  - https://github.com/search?q=owner%3Atktk7l9+created%3A2026-10-06&type=pullrequests
  - https://github.com/advisories/GHSA-68fv-2mgg-jv7q
  - https://github.com/tktk7l9/service-anatomy/pull/115
  - https://github.com/tktk7l9/my-apps-portal/pull/63
  - https://github.com/tktk7l9/zmk-config-roBa/pull/2
---

2026-10-06 は、公開リポジトリのうち 24 本に PR を出した日でした。きっかけは 2 つで、朝に source-map-js の勧告が `npm audit` に載ったことと、GitHub Actions をコミット SHA で固定したことです。Dependabot が開いた PR は公開リポジトリだけで 81 本（Actions 49 本・npm 32 本）ありました。数はいずれも、その日に作られた PR を GitHub の検索で数えたものです。

## source-map-js の勧告が全 lockfile に当たった

GHSA-68fv-2mgg-jv7q は source-map-js 1.2.2 未満のイベントループ DoS で、深刻度は high です。日本時間の 10 月 6 日朝に GitHub の勧告データベースでレビュー済みになり、`npm audit` が該当を返すようになりました。

source-map-js は postcss 経由で入る開発依存なので、npm か pnpm の lockfile を持つ公開リポジトリ 22 本すべてに 1.2.1 が入っていました。本番のバンドルには入りませんが、audit のゲートを置いているリポジトリは CI が赤になります。対応はどれも `npm audit fix` で 1.2.2 に上げるだけで、差分は lockfile の source-map-js の version・resolved・integrity の 3 行です。例外リストに足してゲートを緩めることはしていません。

## Actions をコミット SHA で固定する

同じ日にセキュリティの見直しを回し、ワークフローの `uses:` をタグ（`actions/checkout@v5` など）からコミット SHA に置き換えました。公開リポジトリでは 23 本です。タグは付け替えられるからで、GitHub のドキュメントも、Action を不変のリリースとして使う唯一の方法は完全なコミット SHA での固定だとしています。

固定するときはメジャーを上げず、その時点で使っていた版（多くは checkout v5.1.0・setup-node v5.0.0・gitleaks-action v2.3.9）の SHA にして、版はコメントで残しました。同時に `.github/dependabot.yml` に `github-actions` を足し、SHA のままでも更新の PR が届くようにしています。

## Dependabot の Actions 更新 PR 49 本

`github-actions` を足した直後、Dependabot は Action ごとに別々の PR を開きました。v5 から v7 などへのメジャー更新で、公開リポジトリでは 19 本に計 45 本（checkout 19・setup-node 18・gitleaks-action 5・ほか 3）です。自動マージの対象外なので、CI が緑なのを確かめて 45 本とも手でマージしました。

次からは 1 本にまとまるよう、その 19 本に `groups`（`patterns: ["*"]`）を足す PR を出しました。残りの 5 本は `github-actions` を足すときに最初からグループ設定を入れたので、届いたのはまとめた PR だけです。49 本のうち残りの 4 本がそれにあたります。

## 自動マージは minor/patch だけ

`dependabot-auto-merge.yml` は `dependabot/fetch-metadata` の `update-type` を見て、`semver-minor` と `semver-patch` のときだけ自動マージを有効にします。この日の npm の PR 32 本のうち 26 本はこれでマージされました。条件は ecosystem を見ていないので、Actions のまとめた PR も minor/patch なら自動、メジャーを含めば手動のままです。ワークフローは `pull_request` で起動して送り主が `dependabot[bot]` のときだけ動く公式の形で、`pull_request_target` は使っていません。

メジャーを人の判断に残している理由は、同じ日の chronoscroll がよく表しています。SvelteKit 3 への Dependabot の PR は CI が落ち、tsconfig の書き換えと古い override の削除という移行作業が要りました（[SvelteKit 3 の記事](/blog/chronoscroll-sveltekit-3)）。

## zmk-config-roBa だけはブランチ参照のまま

ZMK ファームウェアの設定リポジトリ zmk-config-roBa は、ZMK のビルド用ワークフローを `@v0.3-branch` で呼んでいて、ここだけは SHA に固定しませんでした（#2）。`config/west.yml` が `revision: v0.3-branch` で ZMK 本体を取ってくるので、片方だけ固定するとファームウェアのソースとビルド手順が別の版になります。ZMK を上げるときは両方を一緒に変えるとコメントに残し、代わりに `permissions: contents: read` で権限を読み取りだけに絞りました。keymap-drawer のワークフローは SHA で固定したまま、Dependabot で更新します。

## 参考

- GitHub の検索: [2026-10-06 に作られた PR](https://github.com/search?q=owner%3Atktk7l9+created%3A2026-10-06&type=pullrequests)・[そのうち Dependabot の PR](https://github.com/search?q=owner%3Atktk7l9+author%3Aapp%2Fdependabot+created%3A2026-10-06&type=pullrequests)
- [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)、対応の例は [ai-primer PR #53](https://github.com/tktk7l9/ai-primer/pull/53)（差分 3 行）・[my-apps-portal PR #56](https://github.com/tktk7l9/my-apps-portal/pull/56)（例外リストは使わない）
- SHA 固定: [service-anatomy PR #115](https://github.com/tktk7l9/service-anatomy/pull/115)、グループ設定なしで足した例は [acro-finder PR #59](https://github.com/tktk7l9/acro-finder/pull/59)
- グループ化と自動マージの条件: [my-apps-portal PR #63](https://github.com/tktk7l9/my-apps-portal/pull/63)
- [zmk-config-roBa PR #2](https://github.com/tktk7l9/zmk-config-roBa/pull/2)、[chronoscroll PR #52](https://github.com/tktk7l9/chronoscroll/pull/52)
- GitHub Docs: [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)（コミット SHA での固定）、[Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)（groups）
