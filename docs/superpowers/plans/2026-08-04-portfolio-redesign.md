# my-apps-portal ポートフォリオ化 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 自分向けの保守ダッシュボードを、エージェント・クライアントに渡せるポートフォリオへ転換する。

**Architecture:** 単一ページ `/` を「ヘッダー → サマリ → 代表作 → 実務プロジェクト → 全件一覧」の 4 層構成にする。既存の `ProjectTable` は最下層にそのまま温存し、その上に新規セクションを積む。サマリ数値は `lib/stats.ts` の純関数がプロジェクトデータから実行時に計算する。

**Tech Stack:** Next.js 16 (App Router) / React 19 / Tailwind CSS 4 / TypeScript / Vitest（新規導入）

**元の設計書:** `docs/superpowers/specs/2026-08-04-portfolio-redesign-design.md`

## Global Constraints

- **Next.js 16 は訓練データと異なる。** `AGENTS.md` の指示どおり、コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読むこと
- **新しい実行時依存を増やさない。** 追加してよいのは devDependencies の Vitest 関連のみ
- **CSP を緩めない。** `next.config.ts` の `img-src 'self' blob: data:` により外部画像を直接読めない。OGP 画像は必ず既存の `/api/ogp?url=...` プロキシ経由で読む
- **配色はダーク固定を維持する。** 背景 `#080c14`、テキスト `text-slate-100`、アクセント `indigo-500`／`emerald-500`
- **数値をハードコードしない。** 作品数・テスト数などは `lib/stats.ts` の計算結果を使う
- **`src/components/ProjectTable.tsx`（882 行）は一切変更しない。** 渡すデータを呼び出し側で絞るだけにする
- **kousan-admin の掲載情報は設計書の範囲を厳守する。** 会社名・物件・テナント情報・スクリーンショット・リポジトリ URL・稼働 URL を書かない
- 日本語 UI。`lang="ja"`

## 事前確認済みの事実

実装前に確認済みのため、再調査は不要。

- `gh repo list tktk7l9` で照合した結果、`projects.ts` に登録済みの 21 件はすべて GitHub 上でも `PUBLIC`。設計書の「データ精度の確認」節および完了条件 7 は**確認済みで齟齬なし**。可視性データの修正は不要
- `platformConfig` の `chrome-extension` は使用プロジェクトが 0 件（`rakuten-spu-helper` は GitHub 上 PRIVATE のため未登録）。**今回は定義を残したまま触らない**。削除しても利用者に見える変化がなく、将来の登録時に必要になる
- `enrichProjectsWithVersions` は `staticTech` が設定されたプロジェクトの package.json 取得をスキップする（`src/lib/repo-versions.ts:98-105`）。kousan-admin は `staticTech` を使うことでネットワークアクセスを回避できる
- 2026-08-04 時点の集計実測値: 21 作品 / テスト計 3,081 / 脆弱性 0 / Lighthouse Performance 平均 98.5・90+ 達成 19/19 / gitleaks 0

## File Structure

**新規作成**

| ファイル | 責務 |
|----------|------|
| `src/lib/projects/types.ts` | 型定義のみ |
| `src/lib/projects/package-meta.ts` | `packageMeta` と `serviceUrls` |
| `src/lib/projects/data.ts` | `rawProjects` と `categories` |
| `src/lib/projects/index.ts` | 再エクスポート。既存の `@/lib/projects` import 互換を保つ |
| `src/lib/stats.ts` | サマリ集計の純関数 |
| `src/lib/stats.test.ts` | 上記のテスト |
| `src/lib/test-fixtures.ts` | テスト用 `RawProject` ファクトリ。複数のテストで共有する |
| `src/lib/featured.ts` | 代表作・非代表作の振り分け関数 |
| `src/lib/featured.test.ts` | 上記のテスト。実データの代表作 4 件も検証する |
| `src/lib/version-status.test.ts` | 既存 `version-status.ts` のテスト |
| `src/components/PortfolioHeader.tsx` | 氏名・肩書き・得意領域・外部リンク（静的） |
| `src/components/StatsSummary.tsx` | サマリ表示（静的） |
| `src/components/FeaturedWorks.tsx` | 代表作カード。自前のモーダル状態を持つ |
| `src/components/ClientWork.tsx` | 実務プロジェクト枠（静的） |
| `vitest.config.ts` | テスト設定とカバレッジ閾値 |
| `.github/workflows/ci.yml` | CI |

**変更**

| ファイル | 変更内容 |
|----------|----------|
| `src/app/page.tsx` | 4 層構成に組み替え。`ProjectTable` へ非代表作のみ渡す |
| `src/app/layout.tsx` | title / description を修正 |
| `src/app/opengraph-image.tsx` | ヘッダー内容に合わせる |
| `package.json` | test スクリプトと devDependencies |

**削除**

- `src/lib/projects.ts` → `src/lib/projects/` へ分割

**変更しない**

- `src/components/ProjectTable.tsx`、`ProjectDetailModal.tsx`、`ProjectTableSkeleton.tsx`、`RefreshButton.tsx`
- `src/lib/github.ts`、`src/lib/repo-versions.ts`、`src/app/api/ogp/route.ts`、`src/app/actions.ts`

---

### Task 1: `lib/projects.ts` をディレクトリに分割する

振る舞いを一切変えないリファクタ。1,182 行の単一ファイルに型定義・パッケージメタ・21 件のデータが同居しており、以降のタスクで毎回この巨大ファイルを開くことになるため先に割る。

**Files:**
- Create: `src/lib/projects/types.ts`
- Create: `src/lib/projects/package-meta.ts`
- Create: `src/lib/projects/data.ts`
- Create: `src/lib/projects/index.ts`
- Delete: `src/lib/projects.ts`

**Interfaces:**
- Consumes: なし
- Produces: `@/lib/projects` から従来どおり以下がすべて import 可能であること。既存の import 文は 1 行も変更しない
  - 型: `Category` / `Platform` / `TechVersion` / `GithubVisibility` / `LighthouseScores` / `TestCoverage` / `SecurityScores` / `SecretScan` / `SecurityHeaders` / `NativeCheckStatus` / `NativeCheck` / `NativeQuality` / `ArchNodeKind` / `ArchNode` / `ArchLayer` / `Architecture` / `RawProject` / `Project` / `PackageMeta`
  - 値: `packageMeta` / `serviceUrls` / `rawProjects` / `categories`

- [ ] **Step 1: 現状の import 元を洗い出して記録する**

```bash
grep -rn "@/lib/projects" src/ | sort
```

この出力を控えておく。Step 6 で同じ結果になることを確認する。

- [ ] **Step 2: `types.ts` を作る**

`src/lib/projects.ts` の 1〜157 行目（`export type Category` から `export type PackageMeta` の閉じ括弧まで）をそのまま `src/lib/projects/types.ts` へ移す。内容は 1 文字も変えない。ファイル冒頭に import は不要（型定義のみで外部参照がない）。

- [ ] **Step 3: `package-meta.ts` を作る**

`src/lib/projects.ts` の `export const packageMeta` と `export const serviceUrls` を `src/lib/projects/package-meta.ts` へ移す。冒頭に型 import を足す。

```ts
import type { PackageMeta } from "./types";
```

- [ ] **Step 4: `data.ts` を作る**

`export const rawProjects` と `export const categories` を `src/lib/projects/data.ts` へ移す。冒頭に型 import を足す。

```ts
import type { Category, RawProject } from "./types";
```

- [ ] **Step 5: `index.ts` を作り、元ファイルを消す**

```ts
export * from "./types";
export * from "./package-meta";
export * from "./data";
```

```bash
rm src/lib/projects.ts
```

- [ ] **Step 6: 型検査とビルドで振る舞い不変を確認する**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: すべて成功。エラーが出た場合は分割ミスなので、移し漏れた宣言を探す。

```bash
grep -rn "@/lib/projects" src/ | sort
```

Expected: Step 1 と同一の出力（import 文を変えていないので当然一致するはず）。

- [ ] **Step 7: コミット**

```bash
git add -A src/lib/projects.ts src/lib/projects/
git commit -m "refactor: projects.ts を types/package-meta/data に分割"
```

---

### Task 2: Vitest を導入し `lib/stats.ts` を TDD で作る

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/stats.ts`
- Create: `src/lib/stats.test.ts`
- Modify: `package.json`（scripts と devDependencies）

**Interfaces:**
- Consumes: `RawProject`（Task 1 の `@/lib/projects`）
- Produces:
  - `export type PortfolioStats`（下記フィールド）
  - `export function computePortfolioStats(projects: RawProject[]): PortfolioStats`

- [ ] **Step 1: Vitest を入れる**

```bash
npm install -D vitest@^3 @vitest/coverage-v8@^3
```

- [ ] **Step 2: `vitest.config.ts` を書く**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/stats.ts", "src/lib/version-status.ts"],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
```

`include` を 2 ファイルに限定しているのは意図的。`github.ts` と `repo-versions.ts` は外部 API の薄いラッパーで、モック作成の労力に対して得られる保証が小さいため対象外とする（設計書の決定）。

- [ ] **Step 3: `package.json` に scripts を足す**

`"lint": "eslint"` の下に追加する。

```json
"test": "vitest run",
"test:watch": "vitest",
"coverage": "vitest run --coverage"
```

- [ ] **Step 4: 失敗するテストを書く**

`src/lib/stats.test.ts`:

まず共有のテストファクトリを `src/lib/test-fixtures.ts` に作る。Task 4 のテストからも使うため、テストファイルごとに複製しない。

```ts
import type { RawProject } from "@/lib/projects";

/** テスト用の最小 RawProject。必要なフィールドだけ上書きして使う */
export function makeProject(overrides: Partial<RawProject> = {}): RawProject {
  return {
    id: "sample",
    name: "Sample",
    description: "説明",
    trackedPackages: [],
    category: "Tool",
    platform: "web",
    services: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
    githubUrl: "https://github.com/tktk7l9/sample",
    githubVisibility: "public",
    emoji: "🧪",
    ...overrides,
  };
}
```

ファイル名を `*.test.ts` にしないこと。`vitest.config.ts` の `include: ["src/**/*.test.ts"]` に拾われ、テストが 0 件のファイルとしてエラーになる。

続いて `src/lib/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computePortfolioStats } from "@/lib/stats";
import { makeProject } from "@/lib/test-fixtures";

describe("computePortfolioStats", () => {
  it("空配列ならすべて 0 で、平均は null になる", () => {
    expect(computePortfolioStats([])).toEqual({
      totalProjects: 0,
      liveProjects: 0,
      totalTests: 0,
      totalVulnerabilities: 0,
      totalSecretLeaks: 0,
      avgLighthousePerformance: null,
      lighthouse90Count: 0,
      lighthouseMeasuredCount: 0,
    });
  });

  it("kind: client の実務案件を集計から除外する", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a" }),
      makeProject({ id: "b", kind: "client" }),
      makeProject({ id: "c", kind: "personal" }),
    ]);
    expect(stats.totalProjects).toBe(2);
  });

  it("liveUrl を持つ作品だけを liveProjects に数える", () => {
    const stats = computePortfolioStats([
      makeProject({ id: "a", liveUrl: "https://example.com" }),
      makeProject({ id: "b" }),
    ]);
    expect(stats.liveProjects).toBe(1);
  });

  it("テスト数・脆弱性・シークレット検出を合計する", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "a",
        testCoverage: {
          statements: 100, branches: 100, functions: 100, lines: 100,
          tests: 200, measuredAt: "2026-01-01",
        },
        securityScores: {
          score: 90, critical: 1, high: 2, moderate: 3, low: 4,
          totalDependencies: 10, tool: "npm", measuredAt: "2026-01-01",
        },
        secretScan: { leaks: 5, commits: 10, measuredAt: "2026-01-01" },
      }),
      makeProject({
        id: "b",
        testCoverage: {
          statements: 80, branches: 80, functions: 80, lines: 80,
          tests: 46, measuredAt: "2026-01-01",
        },
      }),
    ]);
    expect(stats.totalTests).toBe(246);
    expect(stats.totalVulnerabilities).toBe(10);
    expect(stats.totalSecretLeaks).toBe(5);
  });

  it("Lighthouse Performance の平均を小数第1位で丸め、90 以上の件数を数える", () => {
    const lh = (performance: number) => ({
      performance, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-01-01",
    });
    const stats = computePortfolioStats([
      makeProject({ id: "a", lighthouseScores: lh(100) }),
      makeProject({ id: "b", lighthouseScores: lh(99) }),
      makeProject({ id: "c", lighthouseScores: lh(89) }),
      makeProject({ id: "d" }),
    ]);
    expect(stats.avgLighthousePerformance).toBe(96);
    expect(stats.lighthouse90Count).toBe(2);
    expect(stats.lighthouseMeasuredCount).toBe(3);
  });

  it("平均が割り切れない場合は小数第1位に丸める", () => {
    const lh = (performance: number) => ({
      performance, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-01-01",
    });
    const stats = computePortfolioStats([
      makeProject({ id: "a", lighthouseScores: lh(100) }),
      makeProject({ id: "b", lighthouseScores: lh(99) }),
      makeProject({ id: "c", lighthouseScores: lh(98) }),
    ]);
    expect(stats.avgLighthousePerformance).toBe(99);
  });

  it("実務案件は Lighthouse 集計にも含めない", () => {
    const stats = computePortfolioStats([
      makeProject({
        id: "client",
        kind: "client",
        lighthouseScores: {
          performance: 10, accessibility: 10, bestPractices: 10, seo: 10,
          measuredAt: "2026-01-01",
        },
      }),
    ]);
    expect(stats.avgLighthousePerformance).toBeNull();
    expect(stats.lighthouseMeasuredCount).toBe(0);
  });
});
```

- [ ] **Step 5: テストを流して失敗を確認する**

```bash
npm test
```

Expected: FAIL。`Failed to resolve import "@/lib/stats"` あるいは `kind` が `RawProject` に存在しない旨の型エラー。

`kind` はこのタスクで `types.ts` に足す（Task 3 では `featuredRank` と `highlight` を足す）。

- [ ] **Step 6: `types.ts` に `kind` を追加する**

`src/lib/projects/types.ts` の `RawProject` に追記する。`technicalOverview` の直前に置く。

```ts
  /** 実務案件か個人開発か。未設定は "personal" 扱い。
   *  "client" の項目はサマリ集計と一覧テーブルから除外し、専用セクションにのみ出す。 */
  kind?: "personal" | "client";
```

- [ ] **Step 7: `src/lib/stats.ts` を実装する**

```ts
import type { RawProject } from "@/lib/projects";

export type PortfolioStats = {
  /** 個人開発作品の総数（kind: "client" を除く） */
  totalProjects: number;
  /** liveUrl を持つ作品数 */
  liveProjects: number;
  /** testCoverage.tests の合計 */
  totalTests: number;
  /** npm audit の critical + high + moderate + low の合計 */
  totalVulnerabilities: number;
  /** gitleaks 検出数の合計 */
  totalSecretLeaks: number;
  /** Lighthouse Performance の平均（小数第1位）。対象 0 件なら null */
  avgLighthousePerformance: number | null;
  /** Performance 90 以上の件数 */
  lighthouse90Count: number;
  /** lighthouseScores を持つ件数 */
  lighthouseMeasuredCount: number;
};

/** 実務案件を除いた個人開発作品だけを集計対象とする */
function isPersonal(project: RawProject): boolean {
  return project.kind !== "client";
}

export function computePortfolioStats(projects: RawProject[]): PortfolioStats {
  const targets = projects.filter(isPersonal);

  let totalTests = 0;
  let totalVulnerabilities = 0;
  let totalSecretLeaks = 0;
  let liveProjects = 0;
  let performanceSum = 0;
  let lighthouseMeasuredCount = 0;
  let lighthouse90Count = 0;

  for (const project of targets) {
    if (project.liveUrl) liveProjects += 1;
    if (project.testCoverage) totalTests += project.testCoverage.tests;
    if (project.secretScan) totalSecretLeaks += project.secretScan.leaks;

    const security = project.securityScores;
    if (security) {
      totalVulnerabilities +=
        security.critical + security.high + security.moderate + security.low;
    }

    const lighthouse = project.lighthouseScores;
    if (lighthouse) {
      lighthouseMeasuredCount += 1;
      performanceSum += lighthouse.performance;
      if (lighthouse.performance >= 90) lighthouse90Count += 1;
    }
  }

  return {
    totalProjects: targets.length,
    liveProjects,
    totalTests,
    totalVulnerabilities,
    totalSecretLeaks,
    avgLighthousePerformance:
      lighthouseMeasuredCount === 0
        ? null
        : Math.round((performanceSum / lighthouseMeasuredCount) * 10) / 10,
    lighthouse90Count,
    lighthouseMeasuredCount,
  };
}
```

- [ ] **Step 8: テストが通ることを確認する**

```bash
npm test
```

Expected: PASS（7 テスト）。

```bash
npm run coverage
```

Expected: `src/lib/stats.ts` が 100%。`version-status.ts` はまだテストがないので閾値割れで FAIL する。これは Task 3 で解消するため、この時点では `npm test` が通っていればよい。

- [ ] **Step 9: コミット**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/stats.ts src/lib/stats.test.ts src/lib/test-fixtures.ts src/lib/projects/types.ts
git commit -m "test: Vitest を導入しサマリ集計 lib/stats.ts を追加"
```

---

### Task 3: `version-status.ts` のテストを書きカバレッジ閾値を満たす

既存コードにテストを後付けする。ポートフォリオを掲げるリポジトリ自身がノーテストという状態を解消する中核。

**Files:**
- Create: `src/lib/version-status.test.ts`
- Modify: なし（`version-status.ts` の実装は変更しない）

**Interfaces:**
- Consumes: `getVersionStatuses(entries: { techName: string; version: string }[]): Promise<{ statuses: Record<string, VersionStatus>; latestVersions: Record<string, string> }>`
- Produces: なし（テストのみ）

`getVersionStatuses` は `packageMeta` の `displayName` から npm 名を逆引きする。テストでは実在するマッピング（`"Next.js" → "next"`、`"React" → "react"`）を使う。

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/version-status.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getVersionStatuses } from "@/lib/version-status";

type FetchArgs = Parameters<typeof fetch>;

/** npm registry と OSV の応答を差し替える。
 *  npmVersions に載っていないパッケージは 404 を返す。 */
function mockFetch(options: {
  npmVersions?: Record<string, string>;
  osv?: { ok: boolean; vulnFlags?: boolean[]; throws?: boolean };
}) {
  const { npmVersions = {}, osv = { ok: true, vulnFlags: [] } } = options;

  const impl = vi.fn(async (...args: FetchArgs) => {
    const url = String(args[0]);

    if (url.startsWith("https://registry.npmjs.org/")) {
      const pkg = decodeURIComponent(url.split("/")[3]);
      const version = npmVersions[pkg];
      if (!version) return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ version }), { status: 200 });
    }

    if (url === "https://api.osv.dev/v1/querybatch") {
      if (osv.throws) throw new Error("network down");
      if (!osv.ok) return new Response(null, { status: 500 });
      const results = (osv.vulnFlags ?? []).map((hasVuln) =>
        hasVuln ? { vulns: [{ id: "GHSA-xxxx" }] } : {}
      );
      return new Response(JSON.stringify({ results }), { status: 200 });
    }

    throw new Error(`unexpected fetch: ${url}`);
  });

  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getVersionStatuses", () => {
  it("チェック対象外のバージョン表記は unknown にする", async () => {
    mockFetch({});
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "—" },
      { techName: "Next.js", version: "latest" },
      { techName: "Next.js", version: "16.x" },
    ]);
    expect(statuses["Next.js@—"]).toBe("unknown");
    expect(statuses["Next.js@latest"]).toBe("unknown");
    expect(statuses["Next.js@16.x"]).toBe("unknown");
  });

  it("packageMeta に無い技術名は unknown にする", async () => {
    mockFetch({});
    const { statuses } = await getVersionStatuses([
      { techName: "Swift", version: "6.3" },
    ]);
    expect(statuses["Swift@6.3"]).toBe("unknown");
  });

  it("最新版と一致すれば latest、古ければ outdated にする", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12", react: "19.2.8" },
      osv: { ok: true, vulnFlags: [false, false] },
    });
    const { statuses, latestVersions } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
      { techName: "React", version: "19.0.0" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
    expect(statuses["React@19.0.0"]).toBe("outdated");
    expect(latestVersions["React@19.0.0"]).toBe("19.2.8");
  });

  it("OSV が脆弱性を返したら vulnerable を最優先にする", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, vulnFlags: [true] },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("vulnerable");
  });

  it("npm registry が 404 を返したら unknown にする", async () => {
    mockFetch({ npmVersions: {}, osv: { ok: true, vulnFlags: [false] } });
    const { statuses, latestVersions } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("unknown");
    expect(latestVersions["Next.js@16.2.12"]).toBeUndefined();
  });

  it("OSV がエラー応答を返しても脆弱性なしとして続行する", async () => {
    mockFetch({ npmVersions: { next: "16.2.12" }, osv: { ok: false } });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });

  it("OSV への通信が例外を投げても脆弱性なしとして続行する", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, throws: true },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });
});
```

- [ ] **Step 2: テストを流す**

```bash
npm test -- src/lib/version-status.test.ts
```

これは既存コードに対する特性化テスト（characterization test）なので、他タスクの TDD とは期待値が逆になる。**Expected: PASS（7 テスト）。**

FAIL した場合、原因は 2 通りある。切り分けてから直すこと。

1. **モックの応答形状が実装と合っていない** — 大半はこれ。`src/lib/version-status.ts` を読み、`fetchLatestVersions` が `{ version: string }` を、`fetchVulnerableKeys` が `{ results: { vulns?: unknown[] }[] }` を期待していることを確認してモック側を直す
2. **実装に本当のバグがある** — この場合は勝手に直さず、失敗内容を報告して指示を仰ぐ

いずれの場合も、このタスクでは **`version-status.ts` の実装を変更しない**。

- [ ] **Step 3: テストが通ることを確認する**

```bash
npm test
```

Expected: PASS（stats 7 + version-status 7 = 14 テスト）。

- [ ] **Step 4: カバレッジ閾値を満たすことを確認する**

```bash
npm run coverage
```

Expected: `src/lib/stats.ts` と `src/lib/version-status.ts` がともに statements / branches / functions / lines 100%、閾値エラーなしで終了。

100% に届かない行があれば、カバレッジレポートで未到達の行を特定してテストを追加する。実装側は変更しない。

- [ ] **Step 5: コミット**

```bash
git add src/lib/version-status.test.ts
git commit -m "test: version-status のバージョン判定と外部API失敗時の挙動を網羅"
```

---

### Task 4: 代表作フィールドを追加し 4 件に付与する

**Files:**
- Modify: `src/lib/projects/types.ts`
- Modify: `src/lib/projects/data.ts`
- Create: `src/lib/featured.ts`
- Create: `src/lib/featured.test.ts`
- Modify: `vitest.config.ts`（coverage include に `featured.ts` を追加）

**Interfaces:**
- Consumes: `RawProject` / `Project`
- Produces:
  - `RawProject.featuredRank?: number`
  - `RawProject.highlight?: string`
  - `export function selectFeatured<T extends RawProject>(projects: T[]): T[]` — `featuredRank` を持つものだけを昇順で返す
  - `export function selectRest<T extends RawProject>(projects: T[]): T[]` — `featuredRank` を持たず `kind !== "client"` のものを元の順序で返す

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/featured.test.ts`:

Task 2 で作った `makeProject` を再利用する。複製しないこと。

```ts
import { describe, expect, it } from "vitest";
import { rawProjects } from "@/lib/projects";
import { selectFeatured, selectRest } from "@/lib/featured";
import { makeProject } from "@/lib/test-fixtures";

describe("selectFeatured", () => {
  it("featuredRank を持つものだけを昇順で返す", () => {
    const result = selectFeatured([
      makeProject({ id: "c", featuredRank: 3 }),
      makeProject({ id: "plain" }),
      makeProject({ id: "a", featuredRank: 1 }),
      makeProject({ id: "b", featuredRank: 2 }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("代表作が無ければ空配列を返す", () => {
    expect(selectFeatured([makeProject()])).toEqual([]);
  });
});

describe("selectRest", () => {
  it("代表作と実務案件を除いたものを元の順序で返す", () => {
    const result = selectRest([
      makeProject({ id: "featured", featuredRank: 1 }),
      makeProject({ id: "client", kind: "client" }),
      makeProject({ id: "x" }),
      makeProject({ id: "y" }),
    ]);
    expect(result.map((p) => p.id)).toEqual(["x", "y"]);
  });
});

describe("実データの代表作", () => {
  const featured = selectFeatured(rawProjects);

  it("代表作はちょうど 4 件である", () => {
    expect(featured).toHaveLength(4);
  });

  it("featuredRank は 1 から始まる連番で重複しない", () => {
    expect(featured.map((p) => p.featuredRank)).toEqual([1, 2, 3, 4]);
  });

  it("代表作にはすべて highlight が設定されている", () => {
    for (const project of featured) {
      expect(project.highlight, `${project.id} に highlight がない`).toBeTruthy();
    }
  });

  it("highlight は 80 文字以内でカードに収まる", () => {
    for (const project of featured) {
      expect(
        project.highlight!.length,
        `${project.id} の highlight が長すぎる`
      ).toBeLessThanOrEqual(80);
    }
  });
});
```

- [ ] **Step 2: テストを流して失敗を確認する**

```bash
npm test -- src/lib/featured.test.ts
```

Expected: FAIL。`Failed to resolve import "@/lib/featured"`。

- [ ] **Step 3: `types.ts` に 2 フィールドを追加する**

`RawProject` の `kind` の直後に追記する。

```ts
  /** 代表作の並び順。設定されたものだけヒーローセクションに出る（1 始まりの連番） */
  featuredRank?: number;
  /** 代表作カード用の見どころ 1 行（80 文字以内）。description はカードには長すぎるため別に持つ */
  highlight?: string;
```

- [ ] **Step 4: `src/lib/featured.ts` を実装する**

```ts
import type { RawProject } from "@/lib/projects";

/** 代表作を featuredRank の昇順で返す */
export function selectFeatured<T extends RawProject>(projects: T[]): T[] {
  return projects
    .filter((p) => p.featuredRank !== undefined)
    .sort((a, b) => a.featuredRank! - b.featuredRank!);
}

/** 代表作と実務案件を除いた作品を、元の順序のまま返す */
export function selectRest<T extends RawProject>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.featuredRank === undefined && p.kind !== "client"
  );
}
```

- [ ] **Step 5: `vitest.config.ts` の coverage include に追加する**

```ts
      include: [
        "src/lib/stats.ts",
        "src/lib/version-status.ts",
        "src/lib/featured.ts",
      ],
```

- [ ] **Step 6: 実データ 4 件に `featuredRank` と `highlight` を付ける**

`src/lib/projects/data.ts` の該当エントリに、それぞれ `emoji` フィールドの直後へ追記する。

chronoscroll:

```ts
    featuredRank: 1,
    highlight:
      "Wikipedia から歴史ニュース 27,051 件を収集し、縦スクロールの年表に。近似重複排除と関連付けは自前実装。",
```

service-anatomy:

```ts
    featuredRank: 2,
    highlight:
      "人気サービスを技術・UX・ビジネスの4面から解剖する日英マガジン。記事の整合性を 943 テストで CI 強制。",
```

skydial:

```ts
    featuredRank: 3,
    highlight:
      "太陽と月の位置を天文計算で求め、室内に差し込む日射を3D可視化する PWA。Lighthouse 4項目満点。",
```

roba-hud:

```ts
    featuredRank: 4,
    highlight:
      "自作分割キーボードの入力を可視化する macOS 常駐アプリ。ファームの keymap を直接解析しレイヤーを推定。",
```

- [ ] **Step 7: テストが通ることを確認する**

```bash
npm test && npm run coverage
```

Expected: PASS。`featured.ts` も 100%。文字数テストが落ちたら `highlight` を短くする。

- [ ] **Step 8: コミット**

```bash
git add src/lib/projects/types.ts src/lib/projects/data.ts src/lib/featured.ts src/lib/featured.test.ts vitest.config.ts
git commit -m "feat: 代表作フィールド(featuredRank/highlight)を追加し4件に付与"
```

---

### Task 5: kousan-admin を実務プロジェクトとして追加する

**Files:**
- Modify: `src/lib/projects/data.ts`
- Modify: `src/lib/stats.test.ts`（実データに対する回帰テストを追加）

**Interfaces:**
- Consumes: `RawProject.kind`（Task 2）、`selectRest`（Task 4）
- Produces: `rawProjects` に `id: "kousan-admin"` の 1 件（`kind: "client"`）

掲載情報は設計書の範囲を厳守する。会社名・物件・テナント情報・リポジトリ URL・稼働 URL を書かない。

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/stats.test.ts` の末尾に追記する。

```ts
describe("実データに対する集計", () => {
  it("実務案件は集計対象に含まれない", () => {
    const stats = computePortfolioStats(rawProjects);
    const clientCount = rawProjects.filter((p) => p.kind === "client").length;
    expect(clientCount).toBeGreaterThan(0);
    expect(stats.totalProjects).toBe(rawProjects.length - clientCount);
  });

  it("実務案件は外部にリンクを持たない", () => {
    for (const project of rawProjects.filter((p) => p.kind === "client")) {
      expect(project.liveUrl, `${project.id} に liveUrl がある`).toBeUndefined();
      expect(project.githubVisibility).toBe("private");
    }
  });

  it("実務案件は npm バージョン監視の対象外である", () => {
    for (const project of rawProjects.filter((p) => p.kind === "client")) {
      expect(project.staticTech, `${project.id} に staticTech がない`).toBeTruthy();
      expect(project.trackedPackages).toEqual([]);
    }
  });
});
```

ファイル冒頭の import に `rawProjects` を足す。

```ts
import { rawProjects } from "@/lib/projects";
```

- [ ] **Step 2: テストを流して失敗を確認する**

```bash
npm test -- src/lib/stats.test.ts
```

Expected: FAIL。`expect(clientCount).toBeGreaterThan(0)` が 0 で落ちる。

- [ ] **Step 3: `data.ts` に kousan-admin を追加する**

`rawProjects` 配列の先頭（`service-anatomy` の前）に挿入する。

```ts
  {
    id: "kousan-admin",
    name: "社内業務管理システム",
    description:
      "不動産賃貸業を営む企業の社内業務を集約する管理システム。会社・物件・文書・メモ・年次予定・車両・テナント・連絡先・確認事項・区画図の10領域を単一のダッシュボードで扱う。企画・要件定義・設計・実装・運用までを単独で担当し、Phase 1 が本番稼働中。業務ヒアリングをもとに、紙とスプレッドシートに散在していた情報を一箇所へ移した。",
    trackedPackages: [],
    staticTech: [
      { name: "TanStack Start", docsUrl: "https://tanstack.com/start/latest/docs/", version: "1.x" },
      { name: "Cloudflare Workers", docsUrl: "https://developers.cloudflare.com/workers/", version: "—" },
      { name: "Cloudflare D1", docsUrl: "https://developers.cloudflare.com/d1/", version: "—" },
      { name: "Drizzle ORM", docsUrl: "https://orm.drizzle.team/docs/overview", version: "—" },
      { name: "Mantine", docsUrl: "https://mantine.dev/", version: "9.x" },
    ],
    category: "Tool",
    platform: "web",
    services: ["Cloudflare Workers", "Cloudflare D1", "Cloudflare R2", "Cloudflare Access"],
    createdAt: "2026-07-28",
    updatedAt: "2026-07-28",
    githubUrl: "",
    githubVisibility: "private",
    emoji: "🏢",
    kind: "client",
    technicalOverview:
      "TanStack Start を Cloudflare Workers 上で動かし、データベースは D1 + Drizzle ORM、ファイルは R2 に保存する。認証は Cloudflare Access の Google IdP に委譲し、アプリ側に認証情報を持たない。文書は R2 と外部ドライブの両系統を扱い、区画図は登記原文と隣接関係を突き合わせて表示する。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ", sublabel: "Mantine UI / 社内利用のみ", kind: "client" }], connector: "HTTPS (Cloudflare Access 認証)" },
        { nodes: [{ label: "Cloudflare Workers", sublabel: "TanStack Start SSR / サーバー関数", kind: "edge" }], connector: "Drizzle ORM / S3 API" },
        { nodes: [
          { label: "D1", sublabel: "業務データ", kind: "storage" },
          { label: "R2", sublabel: "文書ファイル", kind: "storage" },
        ] },
      ],
    },
  },
```

`githubUrl` を空文字にしているのは、実務案件を専用セクションのみに出し一覧テーブルに載せないため。`selectRest` が `kind: "client"` を除外するので、テーブルが空の URL を読むことはない。

- [ ] **Step 4: テストが通ることを確認する**

```bash
npm test
```

Expected: PASS。

- [ ] **Step 5: ネットワークアクセスが発生しないことを確認する**

```bash
npm run build
```

Expected: 成功。`staticTech` があるため `enrichProjectsWithVersions` は kousan-admin の package.json を取得しない（`src/lib/repo-versions.ts:98-105`）。

- [ ] **Step 6: コミット**

```bash
git add src/lib/projects/data.ts src/lib/stats.test.ts
git commit -m "feat: 実務プロジェクト(kind: client)を1件追加"
```

---

### Task 6: ヘッダーとサマリのセクションを作る

**Files:**
- Create: `src/components/PortfolioHeader.tsx`
- Create: `src/components/StatsSummary.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `computePortfolioStats` / `PortfolioStats`（Task 2）
- Produces:
  - `export function PortfolioHeader(): JSX.Element` — props なし
  - `export function StatsSummary({ stats }: { stats: PortfolioStats }): JSX.Element`

どちらもサーバーコンポーネント（`"use client"` を付けない）。

- [ ] **Step 1: `PortfolioHeader.tsx` を作る**

```tsx
const links = [
  { href: "https://resume-tktk7l9.vercel.app", label: "職務経歴書" },
  { href: "https://github.com/tktk7l9", label: "GitHub" },
];

export function PortfolioHeader() {
  return (
    <header className="mb-8 sm:mb-12">
      <p className="text-xs font-medium tracking-widest text-indigo-400 sm:text-sm">
        PORTFOLIO
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
        齋藤拓也
      </h1>
      <p className="mt-1 text-sm text-slate-300 sm:text-base">
        フリーランス Web エンジニア
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
        React・Next.js を中心に、企画から設計・実装・運用までを一人で担当しています。
        テストと CI による品質の作り込み、パフォーマンスとセキュリティの計測改善を得意としています。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            {label}
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
        ))}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `StatsSummary.tsx` を作る**

Observatory のグレードは達成率が半数どまりのため、サマリには出さない（設計書の決定）。

```tsx
import type { PortfolioStats } from "@/lib/stats";

export function StatsSummary({ stats }: { stats: PortfolioStats }) {
  const items: { label: string; value: string }[] = [
    { label: "作品数", value: `${stats.totalProjects}` },
    { label: "公開中", value: `${stats.liveProjects}` },
    { label: "テスト総数", value: stats.totalTests.toLocaleString("ja-JP") },
    { label: "既知の脆弱性", value: `${stats.totalVulnerabilities}` },
  ];

  if (stats.avgLighthousePerformance !== null) {
    items.push({
      label: "Lighthouse 平均",
      value: `${stats.avgLighthousePerformance}`,
    });
  }

  return (
    <section aria-label="実績サマリ" className="mb-10 sm:mb-14">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/8 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-[#0b1018] px-4 py-4 sm:px-5 sm:py-5">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        各作品の計測値から自動集計しています。
      </p>
    </section>
  );
}
```

- [ ] **Step 3: `page.tsx` に組み込む**

現在の `<header>` ブロックを `PortfolioHeader` に置き換え、`RefreshButton` は一覧セクション側へ移す。`ProjectDataLoader` の中でサマリを描画する（`rawProjects` から同期的に計算できるが、レイアウト上の並び順を保つため同じ Suspense 境界に置く）。

```tsx
import { PortfolioHeader } from "@/components/PortfolioHeader";
import { StatsSummary } from "@/components/StatsSummary";
import { ProjectTable } from "@/components/ProjectTable";
import { RefreshButton } from "@/components/RefreshButton";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import { enrichProjectsWithVersions } from "@/lib/repo-versions";
import { getVersionStatuses } from "@/lib/version-status";
import { getLastCommitDates } from "@/lib/github";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <PortfolioHeader />
        <StatsSummary stats={computePortfolioStats(rawProjects)} />

        <main>
          <ProjectDataLoader />
        </main>

        <footer className="mt-16 border-t border-white/5 pt-8 text-center text-xs text-slate-400">
          <a
            href="https://github.com/tktk7l9"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            github.com/tktk7l9
          </a>
        </footer>
      </div>
    </div>
  );
}
```

`ProjectDataLoader` は Task 7 と Task 8 で書き換える。このステップでは既存のまま残し、`ProjectTable` の呼び出しの直前に `RefreshButton` を移動する。

```tsx
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-bold text-white">すべての作品</h2>
        <div className="ml-auto">
          <RefreshButton />
        </div>
      </div>
      <ProjectTable
        projects={projects}
        versionStatuses={versionStatuses}
        latestVersions={latestVersions}
        lastCommitDates={lastCommitDates}
      />
    </section>
  );
```

- [ ] **Step 4: ビルドと目視で確認する**

```bash
npm run lint && npx tsc --noEmit && npm run build && npm run dev
```

http://localhost:3000 を開き、以下を確認する。

- ヘッダーに氏名・肩書き・得意領域・職務経歴書と GitHub のリンクが出ている
- サマリに 5 つの数値が並び、作品数が 22（kousan-admin を除いた数）になっている
- リンクが新しいタブで開く

- [ ] **Step 5: コミット**

```bash
git add src/components/PortfolioHeader.tsx src/components/StatsSummary.tsx src/app/page.tsx
git commit -m "feat: ポートフォリオのヘッダーと実績サマリを追加"
```

---

### Task 7: 代表作セクションを作る

**Files:**
- Create: `src/components/FeaturedWorks.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Project`（`techVersions` 付き）/ `VersionStatus` / `selectFeatured`（Task 4）/ 既存 `ProjectDetailModal`
- Produces: `export function FeaturedWorks({ projects, versionStatuses, latestVersions, lastCommitDates }): JSX.Element | null`

`ProjectDetailModal` のモーダル状態は `FeaturedWorks` が自前で持つ。`ProjectTable` も内部に同じ状態を持っているが、モーダルは画面全体を覆うため同時に 2 つ開くことはなく、競合しない。この方式なら `ProjectTable` を 1 行も変更せずに済む。

`liveUrl` を持たない作品（RoBaHUD）は OGP 画像が取れないため、絵文字のフォールバックを出す。

- [ ] **Step 1: `FeaturedWorks.tsx` を作る**

```tsx
"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";

export function FeaturedWorks({
  projects,
  versionStatuses,
  latestVersions,
  lastCommitDates,
}: {
  projects: Project[];
  versionStatuses: Record<string, VersionStatus>;
  latestVersions: Record<string, string>;
  lastCommitDates: Record<string, string>;
}) {
  const [selected, setSelected] = useState<Project | null>(null);

  if (projects.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-16">
      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">代表作</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <FeaturedCard
            key={project.id}
            project={project}
            onSelect={() => setSelected(project)}
          />
        ))}
      </div>

      {selected && (
        <ProjectDetailModal
          project={selected}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function FeaturedCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: () => void;
}) {
  const [ogpFailed, setOgpFailed] = useState(false);
  const showOgp = Boolean(project.liveUrl) && !ogpFailed;

  return (
    <article className="overflow-hidden rounded-xl border border-white/8 bg-white/3 transition-colors hover:border-white/15">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full cursor-pointer text-left"
        aria-label={`${project.name} の詳細を開く`}
      >
        <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#0b1018]">
          {showOgp ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/ogp?url=${encodeURIComponent(project.liveUrl!)}`}
              alt={`${project.name} のプレビュー`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setOgpFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              <span aria-hidden="true">{project.emoji}</span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-base font-bold text-white sm:text-lg">
            {project.name}
          </h3>
          {project.highlight && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              {project.highlight}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.techVersions.slice(0, 4).map((tech) => (
              <span
                key={tech.name}
                className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300"
              >
                {tech.name}
              </span>
            ))}
          </div>
          <FeaturedMetrics project={project} />
        </div>
      </button>
    </article>
  );
}

function FeaturedMetrics({ project }: { project: Project }) {
  const metrics: string[] = [];

  if (project.lighthouseScores) {
    metrics.push(`Lighthouse ${project.lighthouseScores.performance}`);
  }
  if (project.testCoverage) {
    metrics.push(`${project.testCoverage.tests} テスト`);
  }
  if (project.securityHeaders?.grade) {
    metrics.push(`Observatory ${project.securityHeaders.grade}`);
  }

  if (metrics.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {metrics.map((metric) => (
        <li key={metric} className="tabular-nums">
          {metric}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: `page.tsx` の `ProjectDataLoader` を書き換える**

代表作を上に、残りをテーブルに渡す。

```tsx
async function ProjectDataLoader() {
  const projects = await enrichProjectsWithVersions(rawProjects);

  const allEntries = projects.flatMap((p) =>
    p.techVersions.map((t) => ({ techName: t.name, version: t.version }))
  );
  const publicRepos = projects
    .filter((p) => p.githubVisibility === "public")
    .map((p) => ({ id: p.id, githubUrl: p.githubUrl }));

  const [{ statuses: versionStatuses, latestVersions }, lastCommitDates] = await Promise.all([
    getVersionStatuses(allEntries),
    getLastCommitDates(publicRepos),
  ]);

  const featured = selectFeatured(projects);
  const rest = selectRest(projects);

  return (
    <>
      <FeaturedWorks
        projects={featured}
        versionStatuses={versionStatuses}
        latestVersions={latestVersions}
        lastCommitDates={lastCommitDates}
      />

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            他の作品
          </h2>
          <span className="text-sm text-slate-500 tabular-nums">{rest.length} 件</span>
          <div className="ml-auto">
            <RefreshButton />
          </div>
        </div>
        <ProjectTable
          projects={rest}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
        />
      </section>
    </>
  );
}
```

import に追加する。

```tsx
import { FeaturedWorks } from "@/components/FeaturedWorks";
import { selectFeatured, selectRest } from "@/lib/featured";
```

- [ ] **Step 3: ビルドと目視で確認する**

```bash
npm run lint && npx tsc --noEmit && npm run build && npm run dev
```

http://localhost:3000 で以下を確認する。

- 代表作が 4 枚、chronoscroll → Service Anatomy → Skydial → RoBaHUD の順で並ぶ
- 上 3 枚に OGP 画像が出る（初回は `/api/ogp` の取得に数秒かかる）
- RoBaHUD は画像がなく絵文字 🖲️ が出る
- カードをクリックすると既存の詳細モーダルが開き、Esc で閉じる
- 下の「他の作品」が 17 件（21 − 代表作 4）で、kousan-admin が含まれない
- カテゴリフィルタの All の件数が 17 になっている

- [ ] **Step 4: コミット**

```bash
git add src/components/FeaturedWorks.tsx src/app/page.tsx
git commit -m "feat: 代表作ヒーローセクションを追加し一覧を非代表作に絞る"
```

---

### Task 8: 実務プロジェクトのセクションを作る

**Files:**
- Create: `src/components/ClientWork.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Project`
- Produces: `export function ClientWork({ projects }: { projects: Project[] }): JSX.Element | null`

外部リンクを持たないカード。モーダルも開かない（掲載情報を設計書の範囲に限定するため、詳細モーダルの GitHub 列や OGP を出さない）。

- [ ] **Step 1: `ClientWork.tsx` を作る**

```tsx
import type { Project } from "@/lib/projects";

export function ClientWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-16">
      <h2 className="mb-1 text-lg font-bold text-white sm:text-xl">
        実務プロジェクト
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        守秘のため、技術構成と担当範囲のみ掲載しています。
      </p>
      <div className="grid gap-4">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl border border-white/8 bg-white/3 p-4 sm:p-5"
          >
            <div className="flex items-baseline gap-2">
              <span aria-hidden="true" className="text-lg">{project.emoji}</span>
              <h3 className="text-base font-bold text-white sm:text-lg">
                {project.name}
              </h3>
              <span className="rounded bg-slate-500/15 px-2 py-0.5 text-xs text-slate-400 ring-1 ring-slate-500/25">
                非公開
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {project.description}
            </p>

            {project.technicalOverview && (
              <p className="mt-3 border-l-2 border-white/10 pl-3 text-xs leading-relaxed text-slate-500">
                {project.technicalOverview}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.techVersions.map((tech) => (
                <span
                  key={tech.name}
                  className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300"
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `page.tsx` に組み込む**

`ProjectDataLoader` の中で、代表作と「他の作品」の間に挿入する。

```tsx
  const clientWorks = projects.filter((p) => p.kind === "client");
```

`<FeaturedWorks ... />` の直後に置く。

```tsx
      <ClientWork projects={clientWorks} />
```

import を追加する。

```tsx
import { ClientWork } from "@/components/ClientWork";
```

- [ ] **Step 3: ビルドと目視で確認する**

```bash
npm run lint && npx tsc --noEmit && npm run build && npm run dev
```

以下を確認する。

- 代表作と「他の作品」の間に実務プロジェクトのカードが 1 枚出る
- 「非公開」バッジが出て、外部リンクが 1 つもない
- カード内に会社名・物件名・テナント名が出ていない
- 技術タグに TanStack Start / Cloudflare Workers / Cloudflare D1 / Drizzle ORM / Mantine が並ぶ

- [ ] **Step 4: コミット**

```bash
git add src/components/ClientWork.tsx src/app/page.tsx
git commit -m "feat: 実務プロジェクトのセクションを追加"
```

---

### Task 9: メタデータと OGP 画像を更新する

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/opengraph-image.tsx`

**Interfaces:**
- Consumes: `computePortfolioStats` / `rawProjects`
- Produces: なし

現在の description は「全 11 プロジェクト」で、実際の 21 件とずれている。二度とずれないよう集計から生成する。

- [ ] **Step 1: `layout.tsx` を書き換える**

```tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import "./globals.css";

const stats = computePortfolioStats(rawProjects);

const title = "齋藤拓也 — ポートフォリオ";
const description = `フリーランス Web エンジニア 齋藤拓也の個人開発ポートフォリオ。React・Next.js を中心に ${stats.totalProjects} 作品を企画から運用まで一人で手がけました。`;
const url = "https://my-apps-portal-tau.vercel.app";
```

`metadata` オブジェクトの残りと `RootLayout` は現状のまま変更しない。`siteName` だけ次のように変える。

```tsx
    siteName: "齋藤拓也 ポートフォリオ",
```

- [ ] **Step 2: `opengraph-image.tsx` を書き換える**

変更するのは 3 箇所だけ。`alt`、大見出しとサブタイトル、下部のチップ列。背景・レイアウト・配色は現状のまま維持する。

大見出しを日本語にしないこと。`ImageResponse`（satori）は CJK グリフに明示的なフォント指定が要るが、現行ファイルは大見出しが英字・日本語が本文サイズという構成で動いている。この構成を崩さない。

`src/app/opengraph-image.tsx` を以下に置き換える。

```tsx
import { ImageResponse } from "next/og";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";

const stats = computePortfolioStats(rawProjects);

export const alt = "齋藤拓也 — ポートフォリオ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chips = [
  `${stats.totalProjects} WORKS`,
  `${stats.totalTests.toLocaleString("en-US")} TESTS`,
  `${stats.totalVulnerabilities} VULNERABILITIES`,
  ...(stats.avgLighthousePerformance === null
    ? []
    : [`LIGHTHOUSE ${stats.avgLighthousePerformance}`]),
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse at 78% 12%, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0) 58%), #080c14",
          color: "#f1f5f9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "24px",
            letterSpacing: "0.16em",
            color: "#7dd3fc",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #38bdf8, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800,
              color: "#080c14",
            }}
          >
            t
          </div>
          GITHUB.COM/TKTK7L9
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "138px",
              fontWeight: 800,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Port<span style={{ color: "#38bdf8" }}>folio</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "rgba(241,245,249,0.62)",
              lineHeight: 1.5,
              maxWidth: "960px",
            }}
          >
            齋藤拓也 — フリーランス Web エンジニア。企画から運用まで一人で。
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          {chips.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: "9999px",
                border: "1px solid rgba(125,211,252,0.32)",
                color: "#7dd3fc",
                fontSize: "22px",
                letterSpacing: "0.06em",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 3: 数値のハードコードが残っていないことを確認する**

```bash
grep -rn "11 プロジェクト\|21 作品\|21作品" src/ || echo "ハードコードなし"
```

Expected: `ハードコードなし`。

- [ ] **Step 4: ビルドと確認**

```bash
npm run lint && npx tsc --noEmit && npm run build && npm run dev
```

http://localhost:3000/opengraph-image を開き、画像が生成されること、文言がヘッダーと一致することを確認する。

- [ ] **Step 5: コミット**

```bash
git add src/app/layout.tsx src/app/opengraph-image.tsx
git commit -m "fix: メタデータの作品数を実データからの生成に変更"
```

---

### Task 10: CI を追加する

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm test` / `npm run coverage` / `npm run lint` / `npm run build`（Task 2 で追加）
- Produces: なし

他プロジェクトに揃えて typecheck / lint / test / build / npm audit / gitleaks を回す。

- [ ] **Step 1: ワークフローを作る**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test with coverage
        run: npm run coverage

      - name: Build
        run: npm run build

      - name: Audit
        run: npm audit --audit-level=high

  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`npm run build` は `getVersionStatuses` と `getLastCommitDates` が外部 API を叩くが、いずれも失敗時は `unknown` にフォールバックする実装のため CI でも通る。

- [ ] **Step 2: ローカルで CI と同じコマンドを通す**

```bash
npm ci && npx tsc --noEmit && npm run lint && npm run coverage && npm run build && npm audit --audit-level=high
```

Expected: すべて成功。

- [ ] **Step 3: コミット**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: typecheck/lint/test/build/audit/gitleaks を追加"
```

- [ ] **Step 4: push して CI の結果を確認する**

```bash
git push -u origin portfolio-redesign
gh run watch
```

Expected: すべてのジョブが green。落ちた場合はログを読んで修正し、再度 push する。

---

## 完了確認

設計書の完了条件に対応する。すべて満たしてから main への統合を検討する。

- [ ] `/` がヘッダー → サマリ → 代表作 → 実務プロジェクト → 他の作品 の順で表示される
- [ ] サマリの数値が `computePortfolioStats` の結果で、`grep -rn "11 プロジェクト" src/` が空
- [ ] 代表作 4 件が `featuredRank` 順に並び、カードから既存モーダルが開く
- [ ] kousan-admin が実務プロジェクト枠にのみ出て、サマリの `totalProjects` と一覧テーブルに含まれない
- [ ] `npm run coverage` が `stats.ts` / `version-status.ts` / `featured.ts` の 100% 閾値を満たす
- [ ] CI が green
- [ ] `projects.ts` の `githubVisibility` が実際の GitHub と一致（**確認済み・変更不要**）
- [ ] 実務プロジェクトのカードに会社名・物件・テナント情報・外部リンクが出ていない
