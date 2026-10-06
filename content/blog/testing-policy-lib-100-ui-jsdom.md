---
title: テスト方針 — 純ロジック層は 100% ゲート、UI 層は jsdom の振る舞いテスト
date: 2026-10-06
summary: engine/lib を純関数に寄せて 100% の閾値を CI で強制し、2026-09-28〜10-01 に全リポジトリで UI 層にも jsdom + Testing Library の振る舞いテストと「実測値の 2 ポイント下」のゲートを足した経緯。書いて見つかったバグも。
tags: [testing, vitest, coverage, ci]
apps: [css-atelier, lumen-bloom, agent-cockpit, acro-finder, snippet-sprint, roba-hud]
sources:
  - https://github.com/tktk7l9/css-atelier/pull/23
  - https://github.com/tktk7l9/acro-finder/pull/50
  - https://github.com/tktk7l9/agent-cockpit
  - https://github.com/tktk7l9/snippet-sprint
  - https://github.com/tktk7l9/roba-hud
---

個人開発では「テストを書く時間があるなら機能を作りたい」になりがちです。それでも全リポジトリでカバレッジゲートを CI に置いているのは、ゲートがあると設計が純関数に寄り、純関数は後から読んでも分かるからです。方針は 2 段構えです。

## 1 段目: 純ロジック層を 100% で止める

採点・集計・天体計算・状態遷移のような処理を `src/engine` や `src/lib` に閉じ込め、DOM・fs・ネットワークに依存しない純関数にします。そこだけ `vitest.config` の `thresholds` を statements / branches / functions / lines すべて 100 にして、CI で下回ったら失敗させます。

- css-atelier / glsl-atelier / snippet-sprint: `src/engine`（採点・出題・統計）
- lumen-bloom / skydial / somewhere-now: `src/astro` などの天体計算と状態導出。skydial は JPL Horizons・USNO・pvlib-python で生成した fixture と突き合わせる
- agent-cockpit: `src/lib`。設定ファイルの編集を `FileSnapshot → FileEdit` の純関数にし、書き込みは `planMutation` に一本化。これで Electron 抜きの plain Node で 100% を測れる
- roba-hud（Swift）: `scripts/coverage-gate.sh` が lib 10 ファイルを行 100% で止める。vitest ではなく llvm-cov

UI や描画層は意図的に外します。snippet-sprint の README にあるとおり、`src/render`（Three.js/WebGL）は jsdom に WebGL がないので対象外です。

「100% は現実的か」という問いには、純関数に限れば現実的、と答えています。数時間で足りるのは lib 層だけで、UI 層を 80% まで持っていくにはアプリごとに数時間かかりました。

## 2 段目: UI 層は振る舞いテストで、閾値は実測の 2 ポイント下

2026-09-28 から 10-01 にかけて、ほぼ全リポジトリで UI 層に jsdom + Testing Library の振る舞いテストを足しました。ファイルごとに `// @vitest-environment jsdom` を宣言し、実際の `index.html` のマークアップを読み込んで、見える文字・ロール・store・URL の状態を assert します。実装の内部ではなく、ユーザーに見えるものを見ます。

閾値は「計測した値の 2 ポイント下」に置きました。resume の設定コメントには「2026-10-01 計測: components 98.4% / app 99.2% lines。床は 2 ポイント下」とあります。100% にしないのは、UI の分岐には jsdom で到達できないものが残るからで、下がったら気づける床があれば十分です。

書いてみて見つかったバグがいくつかあります。

- css-atelier PR #23: 隠れたキャンバスで 3D 描画が止まらずに残っていた
- ai-primer: locale-switcher で pathname が取れないときのフォールバック不備
- lifeplan-simulator PR #92: 主要画面の操作テストを書いて見つかった不具合を同じ PR で修正
- acro-finder PR #50: UI 層のカバレッジが 50% → 99% になった過程で、next dev の StrictMode でリロード時に状態が消える問題を別 PR（#51）で修正

## 内容そのものを検証するテスト

コンテンツを持つアプリでは、コードではなく内容を検証するテストも持ちます。service-anatomy の `content.test.ts` は全記事の ja/en の等価性・出典・スコア範囲を、ai-primer のそれは 40 レッスンと出典 URL の形式を横断検証します。このブログにも同じ型の `content.test.ts` を置き、frontmatter のスキーマ・日付・参照しているアプリ id の実在・内部リンク切れを CI で止めています。

## CI の並び

多くのリポジトリで CI は `typecheck → lint → coverage → build` の順です。Next 16 では `next build` が lint を走らせないので、lint のステップを明示しないとどこでも走りません。セキュリティ系は gitleaks と `npm audit` のゲートを足し、2026-10-03 からは例外リストつきの `scripts/audit-gate.mjs` に置き換えました（ai-primer・acro-finder・このポートフォリオ）。

テスト件数は 2026-10-05 時点で service-anatomy 1,873・sumai-log 1,581・somewhere-now 683・ai-primer 544・chronoscroll 498・skydial 460・agent-cockpit 421・acro-finder 403 などで、合計は一覧ページの上部に出しています。

## 参考

- [css-atelier PR #23](https://github.com/tktk7l9/css-atelier/pull/23) — UI 層の jsdom テストと隠れたキャンバスのバグ
- [acro-finder PR #50](https://github.com/tktk7l9/acro-finder/pull/50) — UI 層のカバレッジ 50% → 99%
- agent-cockpit README（純関数 lib と planMutation）、roba-hud `scripts/coverage-gate.sh`
- 各リポジトリの `vitest.config.ts` の `coverage.thresholds`
