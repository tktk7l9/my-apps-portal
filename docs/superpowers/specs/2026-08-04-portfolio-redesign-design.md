# my-apps-portal ポートフォリオ化 設計書

- 作成日: 2026-08-04
- 対象: `tktk7l9/my-apps-portal`
- 本番: https://my-apps-portal-tau.vercel.app

## 背景と目的

現在の my-apps-portal は自分向けの保守ダッシュボードである。22 アプリを 9 列のテーブルに並べ、npm registry・OSV・GitHub API から latest / outdated / vulnerable を判定して「どのアプリを直すべきか」を可視化している。

これをエージェント・クライアント（案件獲得）に渡せるポートフォリオへ転換する。求められる変化はデータの追加ではなく宛先の転換であり、同じデータでも並べ方と出し方を変える。

現行の課題は 3 点。

1. 代表作と習作が同じ重みで並ぶ。Chronoscroll（27,051 件収集）と hyper-tetris が同一行として扱われている
2. 「アップデートあり n 件」の警告色が最上部に出る。自分向けには有用だが、初見の相手には減点材料になる
3. ポートフォリオを掲げるリポジトリ自身にテストと CI がない。他作品では lib 100% を掲げているため、GitHub を開かれた時点で矛盾が露呈する

## 決定事項

| 論点 | 決定 |
|------|------|
| 最優先の宛先 | エージェント・クライアント（案件獲得） |
| resume サイトとの関係 | 役割分担 + 相互リンク。resume = 経歴の正本、portal = 作品集の正本 |
| 見せ方の骨格 | 代表作ヒーロー + 全件一覧 |
| 保守機能 | 一覧テーブル内に温存。トップには肯定形サマリのみ |
| 代表作の方針 | 幅重視（Web 大作 2 + 3D + ネイティブ） |
| kousan-admin | 「実務プロジェクト」枠を新設し概要のみ掲載 |
| ヘッダー掲載項目 | 得意領域の要約 + 職務経歴書リンク。稼働状況と連絡先は載せない |

## ページ構成

単一ページ（`/`）の縦積みを 4 層にする。

```
┌─ ヘッダー ────────────────────────────────
│  齋藤拓也 / フリーランス Web エンジニア
│  React・Next.js / TypeScript / テストとCI / パフォーマンスとセキュリティ
│  [職務経歴書 ↗]  [GitHub ↗]
├─ サマリ（肯定形の集計のみ）──────────────
│  22作品 · テスト3,146 · 脆弱性0 · Lighthouse平均98.5
├─ 代表作 ─────────────────────────────────
│  Chronoscroll / Service Anatomy / Skydial / RoBa HUD
│  OGP画像 + 見どころ1行 + 実測バッジ → クリックで既存の詳細モーダル
├─ 実務プロジェクト ────────────────────────
│  社内業務システム（非公開・本番稼働中）— 技術構成と役割のみ
└─ 他の作品 18件 ───────────────────────────
   現行テーブルをそのまま。フィルタ・検索・ソート・バージョン監視も維持
```

## サマリに出す指標

`projects.ts` の実データから実行時に計算する。手書きの数値は必ず陳腐化する（現に `layout.tsx` の description は「全 11 プロジェクト」のまま実際は 22 件）。

2026-08-04 時点の実測値:

| 指標 | 実値 | 採用 |
|------|------|------|
| 作品数 | 22（Web 公開 19・ネイティブ 3） | 採用 |
| テスト総数 | 3,146 | 採用 |
| 脆弱性合計（npm audit） | 0 | 採用 |
| Lighthouse Performance | 平均 98.5 / 90+ 達成 19/19 | 採用 |
| gitleaks 検出 | 0 | 採用 |
| Observatory A+ | 9/18 | **不採用** |

Observatory A+ は達成率が半数どまりで、集計として出すと逆に弱点を強調する。個別カード・テーブル行には従来どおり表示するが、サマリには含めない。

## データモデルの変更

`RawProject` に 3 フィールドを追加する。既存フィールドは変更しない。

```ts
/** 代表作の並び順。設定されたものだけヒーローセクションに出る */
featuredRank?: number;
/** 代表作カード用の見どころ 1 行（全角 40〜60 字目安） */
highlight?: string;
/** 実務案件か個人開発か。未設定は "personal" 扱い */
kind?: "personal" | "client";
```

`highlight` が必要な理由: 現行の `description` は Service Anatomy で 244 字、Chronoscroll で 613 字あり、カードに収まらない。テーブルとモーダルでは既存 `description` を引き続き使う。

### kousan-admin の新規追加

`kind: "client"` の 1 件として追加する。掲載する情報を以下に限定する。

- 掲載する: 技術構成（TanStack Start on Cloudflare Workers / D1 + Drizzle / R2 / Cloudflare Access）、担当範囲（企画・設計・実装・運用を単独）、状態（Phase 1 本番稼働中）、機能ドメイン数（会社・物件・文書・メモ・年次予定・車両・テナント・連絡先・確認事項・区画図の 10 領域）
- 掲載しない: 会社名、物件情報、テナント情報、スクリーンショット、リポジトリ URL、稼働 URL

`liveUrl` なし・`githubVisibility: "private"` のため、既存テーブルの GitHub 列やバージョン監視の対象外として扱う必要がある。`kind: "client"` の項目は集計と一覧テーブルから除外し、専用セクションのみに出す。

## コンポーネント構成

### 新規

| ファイル | 責務 |
|----------|------|
| `components/PortfolioHeader.tsx` | 氏名・肩書き・得意領域・resume と GitHub へのリンク。静的 |
| `components/StatsSummary.tsx` | サマリ表示。`lib/stats.ts` の戻り値を受け取るだけ |
| `components/FeaturedWorks.tsx` | 代表作カードグリッド。クリックで既存 `ProjectDetailModal` を開く |
| `components/ClientWork.tsx` | 実務プロジェクト枠。リンクを持たないカード |
| `lib/stats.ts` | サマリ集計の純関数。副作用なし |

`FeaturedWorks` と `ProjectTable` がともにモーダルを開くため、選択状態は両者の親（`page.tsx` 直下のクライアント境界）に持ち上げる。モーダル自体は既存実装を変更せず再利用する。

### 既存の手当て

- **`lib/projects.ts`（1,237 行）を分割** → `lib/projects/{types,package-meta,data,index}.ts`。型定義とデータが同居しているため、代表作フィールドを編集するたびに 1,200 行を開くことになる。ポートフォリオ化でデータはさらに増える。`index.ts` で再エクスポートし、既存の `@/lib/projects` からの import は全て無変更で通す
- **`components/ProjectTable.tsx`（882 行）は分割しない** — 今回は下部セクションとして温存するだけで、内部に手を入れない。触らないことが最も安全

## テストと CI

このリポジトリには現在テストが 1 件もなく、`.github/workflows` は `dependabot-auto-merge.yml` のみ。ポートフォリオ化と同時に解消する。

- Vitest を導入し、カバレッジ閾値ゲートを設定する。対象と閾値は以下のとおり
  - `lib/stats.ts` — statements / branches / functions / lines すべて 100%。純関数のため達成可能
  - `lib/version-status.ts` — 同 100%。npm registry と OSV への fetch はモックする
  - `lib/github.ts`・`lib/repo-versions.ts` — 今回は対象外。外部 API 呼び出しの薄いラッパーであり、モック作成の労力に対して得られる保証が小さい
- GitHub Actions に typecheck / lint / test / build / npm audit / gitleaks を追加する

`lib/stats.ts` を純関数として切り出すのは、この集計ロジックを副作用なしでテストできるようにするためでもある。

## メタデータ修正

- `layout.tsx` の `title` を実名ポートフォリオの体裁に変更する
- `description` の「全 11 プロジェクト」を実データからの生成に変更する
- `opengraph-image.tsx` をヘッダーの内容に合わせて更新する

## データ精度の確認

`projects.ts` では 22 件すべてが `githubVisibility: "public"` になっているが、実際の GitHub 上の公開状態と一致しているか未検証である。ポートフォリオとして公開する以上、private リポジトリを public と表示するのは避けたい。実装時に `gh repo view` で全 22 件の実際の可視性を照合し、齟齬があれば修正する。

あわせて以下も確認する。

- `platformConfig` に `chrome-extension` の定義があるが、使用しているプロジェクトが 1 件もない（rakuten-spu-helper が未登録）。未使用なら定義を残すか、登録するかを判断する
- 各作品の `measuredAt` が古いものについて、サマリの数値として出す妥当性を確認する

## スコープ外

以下は今回実装しない。

- **ケーススタディ個別ページ（`/works/<slug>`）** — 詳細モーダルに `technicalOverview` と `architecture` が既に入っているため、まずそれを活かす。不足が判明した場合に次段で検討する
- **英語対応** — 宛先が国内エージェントのため不要
- **`ProjectTable` の作り直し** — 一覧としての情報密度は現状が適切
- **ライト/ダークテーマ切替** — 現行のダーク固定で統一感が保たれている
- **未登録アプリ（rakuten-spu-helper・figure-3d-studio・plant-ledger 等）の一括追加** — データ精度の確認結果を見て別途判断する

## 完了条件

1. `/` がヘッダー → サマリ → 代表作 → 実務プロジェクト → 全件一覧の順で表示される
2. サマリの数値が `projects.ts` から自動計算され、手書きの件数がコード上に残っていない
3. 代表作 4 件が `featuredRank` で制御され、カードから既存の詳細モーダルが開く
4. kousan-admin が実務プロジェクト枠に表示され、集計と一覧テーブルには含まれない
5. `npm test` が通り、lib 層のカバレッジ閾値を満たす
6. CI が typecheck / lint / test / build / npm audit / gitleaks を実行し green
7. 全 22 件の `githubVisibility` が実際の GitHub の状態と一致している
