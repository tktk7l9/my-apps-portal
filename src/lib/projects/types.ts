export type Category = "All" | "Game" | "Simulator" | "Tool" | "Other";

/** プラットフォーム種別。Webアプリ・Chrome拡張・その他を区別 */
export type Platform = "web" | "chrome-extension" | "other";

export type TechVersion = {
  name: string;
  docsUrl: string;
  version: string;
  versionUrl?: string;
};

export type GithubVisibility = "public" | "private" | "local-only";

export type LighthouseScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  measuredAt: string;
};

export type TestCoverage = {
  /** 0..100 */
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  /** テスト総数 */
  tests: number;
  /** ISO 日付 */
  measuredAt: string;
  /** 範囲メモ (e.g. "lib 100% / 全体 80%") */
  notes?: string;
};

/** npm/pnpm audit ベースのセキュリティスコア。
 *  score = max(0, 100 - 25*critical - 10*high - 3*moderate - 1*low) */
export type SecurityScores = {
  /** 0..100 */
  score: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  /** audit が走査した依存数 (production + dev) */
  totalDependencies: number;
  /** "npm" | "pnpm" など */
  tool: "npm" | "pnpm" | "none";
  /** ISO 日付 */
  measuredAt: string;
  notes?: string;
};

/** gitleaks による secrets スキャン結果 (git履歴含む) */
export type SecretScan = {
  /** 検出された潜在的なシークレット数 (false positive は .gitleaksignore で除外済み) */
  leaks: number;
  /** スキャン対象のcommit数 */
  commits: number;
  measuredAt: string;
  notes?: string;
};

/** Mozilla Observatory による HTTPセキュリティヘッダー評価 */
export type SecurityHeaders = {
  /** "A+" | "A" | "A-" | "B+" | "B" | ... | "F" | null (未スキャン or 失敗) */
  grade: string | null;
  /** 0..135 (Observatory のスコア、100超で A+) */
  score: number | null;
  /** 通過テスト数 (10中) */
  passed?: number;
  total?: number;
  /** ISO 日付 */
  measuredAt: string;
  notes?: string;
};

/** ネイティブ/CLI アプリ向けの品質チェック（Lighthouse の代替）。
 *  Web ページを持たないアプリで、客観的に検証可能な項目のみを pass/warn/fail で示す。 */
export type NativeCheckStatus = "pass" | "warn" | "fail";

export type NativeCheck = {
  label: string;
  status: NativeCheckStatus;
  detail?: string;
};

export type NativeQuality = {
  checks: NativeCheck[];
  /** ISO 日付 */
  measuredAt: string;
  notes?: string;
};

/** システム構成図のノード種別。色分け・凡例に使用 */
export type ArchNodeKind = "client" | "edge" | "server" | "external" | "storage" | "build";

/** 構成図の 1 ノード（ボックス） */
export type ArchNode = {
  label: string;
  sublabel?: string;
  kind: ArchNodeKind;
};

/** 構成図の 1 レイヤー。同一レイヤーのノードは横並び、レイヤー間は上→下へ矢印で接続 */
export type ArchLayer = {
  nodes: ArchNode[];
  /** 次（下）のレイヤーへ向かう接続ラベル（プロトコル・データ等）。最下層では無視 */
  connector?: string;
};

/** システム構成図。layers を上から下へ描画する */
export type Architecture = {
  layers: ArchLayer[];
};

export type RawProject = {
  id: string;
  name: string;
  description: string;
  trackedPackages: string[];
  /** 主要技術を直接宣言する（npm に無い技術＝Swift 等向け）。
   *  設定時は trackedPackages の npm バージョン監視より優先される。 */
  staticTech?: TechVersion[];
  category: Exclude<Category, "All">;
  platform: Platform;
  services: string[];
  createdAt: string;
  updatedAt: string;
  githubUrl: string;
  githubVisibility: GithubVisibility;
  liveUrl?: string;
  favicon?: string;
  emoji: string;
  lighthouseScores?: LighthouseScores;
  /** Web を持たないネイティブ/CLI アプリの品質指標（Lighthouse の代替）。 */
  nativeQuality?: NativeQuality;
  testCoverage?: TestCoverage;
  securityScores?: SecurityScores;
  secretScan?: SecretScan;
  securityHeaders?: SecurityHeaders;
  /** 技術的概要（2〜4文） */
  technicalOverview?: string;
  /** システム構成図 */
  architecture?: Architecture;
};

export type Project = RawProject & {
  techVersions: TechVersion[];
};

export type PackageMeta = {
  displayName: string;
  docsUrl: string;
  versionUrl: (version: string) => string | undefined;
};
