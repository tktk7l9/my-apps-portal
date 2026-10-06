---
title: Service Anatomy — 記事をデータベースのレコードとして扱う編集設計
date: 2026-10-06
summary: 解剖スコア・確度3段階の技術構成・出典を frontmatter に持たせ、記事の整合性を CI で検証する仕組み。nonce CSP を捨てて全ルートを SSG 化し、Cloudflare Workers へ移すまでの判断も含めて。
tags: [service-anatomy, nextjs, content-modeling, cloudflare-workers, csp]
apps: [service-anatomy]
sources:
  - https://github.com/tktk7l9/service-anatomy
  - https://github.com/tktk7l9/service-anatomy/blob/main/AGENTS.md
  - https://serviceanatomy.com
---

[Service Anatomy](https://serviceanatomy.com) は、人気サービスを「サービス解説・UX 分析・技術構成の推定・ビジネスモデル」の 4 面から公開情報だけで読み解く日本語/英語の分析マガジンです。記事 54 本と、2 つのサービスを突き合わせる比較解剖 12 本があります（2026-10-06 時点の `content/` 実測）。

この記事では、ブログというより「記事をレコードとして扱う」ことを優先した編集設計について書きます。

## frontmatter が記事のスキーマ

記事は `content/articles/<slug>/{ja,en}.md` に置き、frontmatter に次のような構造化フィールドを持たせています。バリデータは `src/engine/articles/schema.ts` に手書きしています。

- **scores**: product / ux / tech / business の 4 軸。各 0〜5 を 0.5 刻みで、範囲外はビルドエラー
- **techStack[]**: layer・name・confidence・evidence。confidence は `confirmed` / `likely` / `speculative` の 3 段階で、`confirmed` には一次情報の `evidenceUrl` が必須
- **sources[]**: 1 件以上必須
- **revisions[]**: 定点観測の履歴（date・scores・note）

「推測を事実のように書かない」をルールではなくデータ型で担保するのが狙いです。確度が `confirmed` なのに URL がなければ、記事は公開されません。

本文側も同じ発想で、`remark-directive` の独自ディレクティブを使います。`:::fact` と `:::guess` で観測事実と推測を明示し、`::scorecard` と `::techstack` は frontmatter のデータを描画する React コンポーネントの差し込み位置です。ディレクティブはいったんマーカー付きの HTML にし、純関数で分割してから React コンポーネントを間に差し込む形にしました。`dangerouslySetInnerHTML` の内側にコンポーネントを置けない問題を避けるためです。

## 整合性は CI で強制する

`src/engine/articles/content.test.ts` が全記事を `describe.each` で回すので、記事を追加すると自動的にテスト対象になります。主な検証項目は次のとおりです。

- slug の一意性、ja/en で言語に依存しないフィールド（スコア・techStack など）が一致すること
- `publishedAt <= updatedAt`、どの日付も未来でないこと
- 各言語で h2 が 4 本以上、scorecard と techstack が各 1 回だけ差し込まれていること
- レンダリング結果に `<script` が含まれないこと
- CJK 括弧に隣接した `**強調**` が生のまま残っていないこと（Markdown の解釈失敗を検出）

テスト件数は 2026-10-05 時点で 1,873 件、engine と i18n 層は 100% のカバレッジゲートを CI で強制しています。

## nonce CSP を捨てて Workers へ

ホスティングは Vercel から始めましたが、2026-08-11 に無料枠超過でアカウントが止まりました。Cloudflare Workers（`@opennextjs/cloudflare`）へ移す際に壁になったのが、リクエストごとの nonce で CSP を発行していた middleware です。Next 16 の proxy は Node ランタイム専用で、OpenNext は Node middleware に対応していないため、nonce を残す限り移行できませんでした。

2026-09-12 の PR #14 で nonce をやめて `next.config.ts` の静的ヘッダー方式へ移し、`script-src 'self' 'unsafe-inline'` に着地しました。インライン XSS への防御と Observatory の A+ を代償として受け入れた判断で、その結果 Observatory は B（75・10/12）です。失点は CSP の -20 と、Cloudflare Web Analytics のビーコンに SRI を付けていない -5 の 2 項目だけです。

続く PR #15 で全ルートを SSG 化（`generateStaticParams` + `dynamicParams = false`）し、861 ページをビルド時に生成する形にして、PR #16 で Workers へ移しました。nonce をやめたことで per-request レンダリングの連鎖も切れ、CDN にそのまま載るようになっています。

初回デプロイでは `open-next.config.ts` に `incrementalCache` を指定し忘れ、記事・タグ・技術・カテゴリのページが全部 404 になりました（PR #17）。トップや RSS は 200 のままなので、サイトが生きているように見えるのが厄介な点です。それ以来、動作確認は sitemap から実 URL を拾って動的セグメントを叩くことにしています。

## 参考

- [tktk7l9/service-anatomy](https://github.com/tktk7l9/service-anatomy) — AGENTS.md（執筆規約・SSG の前提）
- `docs/superpowers/specs/2026-09-12-drop-nonce-csp-design.md` — nonce CSP を捨てる設計書
- PR #14（nonce CSP 廃止）・#15（全ルート SSG）・#16（Workers 移行）・#17（incrementalCache）
