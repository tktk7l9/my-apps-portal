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

export const packageMeta: Record<string, PackageMeta> = {
  next: {
    displayName: "Next.js",
    docsUrl: "https://nextjs.org/docs",
    versionUrl: (v) => `https://github.com/vercel/next.js/releases/tag/v${v}`,
  },
  react: {
    displayName: "React",
    docsUrl: "https://react.dev",
    versionUrl: (v) => `https://github.com/facebook/react/releases/tag/v${v}`,
  },
  three: {
    displayName: "Three.js",
    docsUrl: "https://threejs.org/docs/",
    versionUrl: (v) => {
      const minor = v.split(".")[1];
      return minor ? `https://github.com/mrdoob/three.js/releases/tag/r${minor}` : undefined;
    },
  },
  vite: {
    displayName: "Vite",
    docsUrl: "https://vite.dev/guide/",
    versionUrl: (v) => `https://github.com/vitejs/vite/releases/tag/v${v}`,
  },
  typescript: {
    displayName: "TypeScript",
    docsUrl: "https://www.typescriptlang.org/docs/",
    versionUrl: (v) => {
      const parts = v.split(".");
      if (parts.length < 2) return undefined;
      return `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-${parts[0]}-${parts[1]}.html`;
    },
  },
  "@anthropic-ai/sdk": {
    displayName: "Anthropic SDK",
    docsUrl: "https://docs.anthropic.com/",
    versionUrl: (v) => `https://github.com/anthropics/anthropic-sdk-js/releases/tag/sdk-v${v}`,
  },
  "@supabase/supabase-js": {
    displayName: "Supabase JS",
    docsUrl: "https://supabase.com/docs/reference/javascript/",
    versionUrl: (v) =>
      v.endsWith("x")
        ? "https://github.com/supabase/supabase-js/releases"
        : `https://github.com/supabase/supabase-js/releases/tag/v${v}`,
  },
  "@google/generative-ai": {
    displayName: "Gemini API",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    versionUrl: (v) => `https://github.com/google-gemini/generative-ai-js/releases/tag/v${v}`,
  },
  tailwindcss: {
    displayName: "Tailwind CSS",
    docsUrl: "https://tailwindcss.com/docs",
    versionUrl: (v) => `https://github.com/tailwindlabs/tailwindcss/releases/tag/v${v}`,
  },
  "@tanstack/react-start": {
    displayName: "TanStack Start",
    docsUrl: "https://tanstack.com/start/latest/docs/",
    versionUrl: (v) => `https://github.com/TanStack/router/releases/tag/v${v}`,
  },
};

export const serviceUrls: Record<string, string> = {
  Vercel:            "https://vercel.com",
  Supabase:          "https://supabase.com",
  "Anthropic Claude": "https://anthropic.com",
  "Google Gemini":   "https://ai.google.dev",
  Resend:            "https://resend.com",
  "GitHub Pages":    "https://pages.github.com",
};

export const rawProjects: RawProject[] = [
  {
    id: "lifeplan-simulator",
    name: "ライフプランシミュレーター",
    description: "収入・支出・住宅・ライフイベント・投資を入力して老後（100歳まで）の資産推移をシミュレーション。",
    trackedPackages: ["next", "react", "three", "@anthropic-ai/sdk"],
    category: "Simulator",
    platform: "web",
    services: ["Vercel", "Anthropic Claude"],
    createdAt: "2026-04-20",
    updatedAt: "2026-04-24",
    githubUrl: "https://github.com/tktk7l9/lifeplan-simulator",
    githubVisibility: "public",
    liveUrl: "https://lifeplan-simulator-azure.vercel.app",
    favicon: "/favicons/lifeplan-simulator.svg",
    technicalOverview:
      "資産推移のシミュレーションは lib/simulation の純関数でクライアント側で完結し、状態は Zustand、入力フォームは React Hook Form + Zod で検証する。AI 評価機能のみ Next.js の Route Handler 経由で Claude を呼び出し、レスポンスを Zod でバリデーションする。グラフは Recharts、背景演出は Three.js。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "Zustand / RHF+Zod / Recharts / Three.js", kind: "client" }], connector: "AI評価のみ (HTTPS)" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "Route Handler /api/evaluate ・レート制限", kind: "server" }], connector: "messages.create" },
        { nodes: [{ label: "Anthropic Claude API", sublabel: "claude-sonnet-4-6", kind: "external" }] },
      ],
    },
    emoji: "🏔️",
    lighthouseScores: { performance: 98, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    testCoverage: {
      statements: 92.41, branches: 77.65, functions: 88.60, lines: 93.65,
      tests: 367, measuredAt: "2026-05-27",
      notes: "lib層 100% / 全体 92%。Slider/Three.js/SaveDialog/ImportDialog の interaction 網羅",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 660, tool: "npm", measuredAt: "2026-05-20",
      notes: "vitest v4 / @vitejs/plugin-react v6 へ更新 + brace-expansion override で0件化",
    },
    secretScan: { leaks: 0, commits: 12, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "parkour-cat",
    name: "パルクール猫",
    description: "猫がアクロバティックに都市と自然を駆け抜けるThree.js / WebGLパルクールゲーム。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Game",
    platform: "web",
    services: ["GitHub Pages"],
    createdAt: "2026-04-24",
    updatedAt: "2026-05-26",
    githubUrl: "https://github.com/tktk7l9/parkour-cat",
    githubVisibility: "public",
    liveUrl: "https://tktk7l9.github.io/parkour-cat/",
    favicon: "/favicons/parkour-cat.svg",
    technicalOverview:
      "フレームワークを使わないバニラ TypeScript 構成。Three.js の WebGL レンダラと requestAnimationFrame のゲームループでステージを描画し、処理はすべてクライアントで完結する。Vite で ESM にバンドルし、静的アセットを GitHub Pages から配信。バックエンドは持たない。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (WebGL)", sublabel: "Three.js レンダラ / ゲームループ", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "GitHub Pages", sublabel: "静的ホスティング", kind: "edge" }] },
      ],
    },
    emoji: "🐈",
    lighthouseScores: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 55, tool: "npm", measuredAt: "2026-05-26",
    },
    secretScan: { leaks: 0, commits: 13, measuredAt: "2026-05-20" },
    securityHeaders: {
      grade: null, score: null, measuredAt: "2026-05-20",
      notes: "GitHub Pages のサブパス配信のため Observatory が直接スキャン不可",
    },
  },
  {
    id: "hyper-tetris",
    name: "Hyper Tetris",
    description: "3D / 4D / 5D / 6D次元に拡張された実験的テトリスゲーム。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Game",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-04-27",
    updatedAt: "2026-04-27",
    githubUrl: "https://github.com/tktk7l9/hyper-tetris",
    githubVisibility: "public",
    liveUrl: "https://hyper-tetris.vercel.app",
    favicon: "/favicons/hyper-tetris.svg",
    technicalOverview:
      "バニラ TypeScript + Three.js 構成。3D〜6D に拡張したテトリスの盤面を高次元から射影してレンダリングし、ゲームループはクライアントで完結する。Vite でビルドして Vercel に静的配信。バックエンドなし。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (WebGL)", sublabel: "Three.js / 多次元射影レンダリング", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "Vercel", sublabel: "静的ホスティング / CDN", kind: "edge" }] },
      ],
    },
    emoji: "🟦",
    lighthouseScores: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 55, tool: "npm", measuredAt: "2026-05-19",
    },
    secretScan: { leaks: 0, commits: 7, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "housing-performance-simulator",
    name: "住宅性能シミュレーター",
    description: "断熱・気密性能と設備選択を初期費用と30年ランニングコストの両面から比較。",
    trackedPackages: ["next", "react", "three"],
    category: "Simulator",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-04-28",
    updatedAt: "2026-04-28",
    githubUrl: "https://github.com/tktk7l9/housing-performance-simulator",
    githubVisibility: "public",
    liveUrl: "https://housing-performance-simulator.vercel.app",
    favicon: "/favicons/housing-performance-simulator.svg",
    technicalOverview:
      "断熱・気密性能と設備のコスト計算は lib の純関数でクライアント側で完結する。結果は Recharts で可視化し、@react-pdf/renderer で PDF 出力、lz-string で入力条件を URL に圧縮共有する。状態は Zustand、フォームは React Hook Form + Zod。Next.js を Vercel に配信し、外部 API は持たない。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "lib計算 / Recharts / @react-pdf / lz-string共有", kind: "client" }], connector: "静的配信 (HTTPS)" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "App Router / 外部APIなし", kind: "server" }] },
      ],
    },
    emoji: "🏠",
    lighthouseScores: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    testCoverage: {
      statements: 96.45, branches: 90.57, functions: 93.99, lines: 97.01,
      tests: 324, measuredAt: "2026-05-26",
      notes: "lib層 99.20% / 全体 96%。Select/Dialog/Input/各 step interaction まで網羅",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 696, tool: "npm", measuredAt: "2026-05-20",
      notes: "vitest v4 / @vitejs/plugin-react v6 へ更新 + brace-expansion override で0件化",
    },
    secretScan: { leaks: 0, commits: 8, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "ai-news-feed-app",
    name: "AIニュース・ダイジェスト",
    description: "毎朝6時（JST）更新するAI関連トピックの日本語ダイジェストWebアプリ。カテゴリ別閲覧・アーカイブ対応。",
    trackedPackages: ["next", "react", "@supabase/supabase-js", "@google/generative-ai"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Supabase", "Google Gemini", "Resend"],
    createdAt: "2026-04-26",
    updatedAt: "2026-05-14",
    githubUrl: "https://github.com/tktk7l9/ai-news-feed-app",
    githubVisibility: "public",
    liveUrl: "https://ai-news-feed-app.vercel.app",
    favicon: "/favicons/ai-news-feed-app.svg",
    technicalOverview:
      "Vercel Cron が毎朝6時(JST)に各社 RSS を取得(rss-parser)し、Gemini で日本語ダイジェストを生成して集約ジョブが Supabase(Postgres)に保存する。閲覧時は Next.js が Supabase から取得して配信し、音声読み上げは api/tts 経由。クリーンアップ用 Cron と Resend 通知も備える。",
    architecture: {
      layers: [
        { nodes: [{ label: "Vercel Cron", sublabel: "毎朝6時 JST / cleanup", kind: "server" }], connector: "① RSS取得 → Gemini要約" },
        { nodes: [{ label: "Google Gemini API", sublabel: "日本語ダイジェスト生成", kind: "external" }], connector: "② ジョブが結果を保存" },
        { nodes: [{ label: "Supabase", sublabel: "Postgres 永続化", kind: "storage" }], connector: "③ 閲覧時に取得" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "SSR / api/tts 音声", kind: "server" }], connector: "④ 配信 (HTTPS)" },
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "カテゴリ・アーカイブ・音声再生", kind: "client" }] },
      ],
    },
    emoji: "📰",
    lighthouseScores: { performance: 98, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 441, tool: "npm", measuredAt: "2026-06-10",
      notes: "brace-expansion (ReDoS) 解消済。/api/tts に同一オリジン確認+レート制限を追加",
    },
    secretScan: { leaks: 0, commits: 28, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B", score: 75, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "tricking-3d",
    name: "Tricking 3D Analyzer",
    description: "トリッキング / パルクールの技をThree.jsで3D表示し、回転軸・重心軌跡を可視化する分析ツール。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Tool",
    platform: "web",
    services: [],
    createdAt: "2026-05-06",
    updatedAt: "2026-05-06",
    githubUrl: "https://github.com/tktk7l9/tricking-3d",
    githubVisibility: "public",
    liveUrl: "https://tricking-3d.vercel.app",
    favicon: "/favicons/tricking-3d.svg",
    technicalOverview:
      "バニラ TypeScript + Three.js 構成。技のモーションを 3D 表示し、回転軸と重心の軌跡を可視化する。計算・描画はクライアントで完結し、Vite でビルドして Vercel に静的配信。バックエンドなし。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (WebGL)", sublabel: "Three.js / 回転軸・重心軌跡の可視化", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "Vercel", sublabel: "静的ホスティング / CDN", kind: "edge" }] },
      ],
    },
    emoji: "🤸",
    lighthouseScores: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 55, tool: "npm", measuredAt: "2026-05-19",
    },
    secretScan: { leaks: 0, commits: 5, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "resume",
    name: "職務経歴書",
    description: "Next.js + Tailwind CSS + shadcn/uiで構築したインタラクティブな職務経歴書サイト。",
    trackedPackages: ["next", "react"],
    category: "Other",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2025-03-18",
    updatedAt: "2025-03-19",
    githubUrl: "https://github.com/tktk7l9/resume",
    githubVisibility: "public",
    liveUrl: "https://resume-tktk7l9.vercel.app",
    favicon: "/favicons/resume.svg",
    technicalOverview:
      "Next.js App Router で構築した静的中心の職務経歴書サイト(ja/en)。shadcn/ui + Tailwind CSS で UI を組み、問い合わせフォームは Server Action から Resend 経由でメール送信する。Vercel に配信。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "ja/en 切替 / shadcn/ui", kind: "client" }], connector: "問い合わせ送信 (Server Action)" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "App Router / Server Action", kind: "server" }], connector: "メール送信 (API)" },
        { nodes: [{ label: "Resend", sublabel: "メール配信", kind: "external" }] },
      ],
    },
    emoji: "📄",
    lighthouseScores: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 187, tool: "pnpm", measuredAt: "2026-05-20",
      notes: "pnpm-workspace.yaml の overrides で transitive な glob/minimatch/picomatch/brace-expansion/yaml/postcss を新版に固定",
    },
    secretScan: { leaks: 0, commits: 37, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "elparaiso",
    name: "EL PARAISO",
    description: "2021年発足のコミュニティブランドWebサイト。染め・プリント・グラフィックデザインで日々の感情や情景をプロダクトに反映。",
    trackedPackages: ["next", "react", "tailwindcss", "@supabase/supabase-js"],
    category: "Other",
    platform: "web",
    services: ["Vercel", "Supabase"],
    createdAt: "2021-03-26",
    updatedAt: "2026-05-14",
    githubUrl: "https://github.com/tktk7l9/elparaiso",
    githubVisibility: "public",
    liveUrl: "https://elparaiso.vercel.app",
    favicon: "/favicons/elparaiso.svg",
    technicalOverview:
      "Next.js App Router によるコミュニティブランドサイト。ギャラリーや商品情報は Supabase(Postgres・Storage)から取得し、認証は @supabase/auth-ui を利用する。Vercel に配信。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "ギャラリー / 認証UI", kind: "client" }], connector: "ページ取得 (HTTPS)" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "App Router", kind: "server" }], connector: "データ取得 / 認証" },
        { nodes: [{ label: "Supabase", sublabel: "Postgres / Auth / Storage(画像)", kind: "storage" }] },
      ],
    },
    emoji: "🌴",
    lighthouseScores: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 442, tool: "npm", measuredAt: "2026-05-19",
    },
    secretScan: { leaks: 0, commits: 60, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B", score: 75, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "my-apps-portal",
    name: "My Apps Portal",
    description: "個人アプリの一覧・管理ポータル。依存パッケージのバージョン監視・脆弱性チェック・最終コミット日取得を自動化。",
    trackedPackages: ["next", "react", "tailwindcss", "typescript"],
    category: "Tool",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-05-14",
    updatedAt: "2026-05-14",
    githubUrl: "https://github.com/tktk7l9/my-apps-portal",
    githubVisibility: "public",
    liveUrl: "https://my-apps-portal-tau.vercel.app",
    favicon: "/favicons/my-apps-portal.svg",
    technicalOverview:
      "Next.js の Server Components が npm registry・OSV・GitHub API を取得(1時間キャッシュ)し、各アプリのバージョン / 脆弱性 / 最終コミットを集約する。OGP 画像は /api/ogp プロキシ経由(24時間キャッシュ)。アプリ定義は projects.ts に集約。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "フィルタ・ソート / 詳細モーダル", kind: "client" }], connector: "ページ取得 (HTTPS)" },
        { nodes: [{ label: "Next.js · Vercel", sublabel: "Server Components / api/ogp / 1h・24hキャッシュ", kind: "server" }], connector: "集約取得" },
        { nodes: [
          { label: "npm registry", kind: "external" },
          { label: "OSV API", kind: "external" },
          { label: "GitHub API", kind: "external" },
          { label: "og:image", sublabel: "各アプリ", kind: "external" },
        ] },
      ],
    },
    emoji: "🗂️",
    lighthouseScores: { performance: 98, accessibility: 100, bestPractices: 100, seo: 100, measuredAt: "2026-05-17" },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 427, tool: "npm", measuredAt: "2026-06-10",
      notes: "next 16.2.7 / react 19.2.7 へ更新",
    },
    secretScan: { leaks: 0, commits: 38, measuredAt: "2026-05-20" },
    securityHeaders: { grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-05-20" },
  },
  {
    id: "acro-finder",
    name: "ACRO/FINDER",
    description: "トリッキング・パルクールなどアクロバットを練習できる施設を地図とリストで検索。営業時間・器具・レッスン・現在地からの距離を確認できる。",
    trackedPackages: ["next", "react", "typescript"],
    category: "Tool",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-05-20",
    updatedAt: "2026-05-20",
    githubUrl: "https://github.com/tktk7l9/acro-finder",
    githubVisibility: "public",
    liveUrl: "https://acro-finder.vercel.app",
    favicon: "/favicons/acro-finder.svg",
    technicalOverview:
      "Next.js App Router。施設データはリポジトリ内に保持して SSR / 静的配信し、地図は Leaflet + markercluster で描画する。地図タイルは OpenStreetMap から取得、現在地からの距離計算はクライアント。proxy.ts で nonce ベースの CSP を付与し、Vercel に配信。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (React 19)", sublabel: "Leaflet / markercluster / 現在地距離計算", kind: "client" }], connector: "データ・タイル取得 (HTTPS)" },
        { nodes: [
          { label: "Next.js · Vercel", sublabel: "proxy.ts nonce CSP / 施設データ配信", kind: "server" },
          { label: "OpenStreetMap", sublabel: "地図タイル", kind: "external" },
        ] },
      ],
    },
    emoji: "📍",
    lighthouseScores: {
      performance: 93, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-05-20",
    },
    testCoverage: {
      statements: 98.51, branches: 96.55, functions: 98.3, lines: 99.16,
      tests: 62, measuredAt: "2026-05-20",
      notes: "lib層 + コンポーネント(地図ライブラリ依存の InteractiveMap を除く) を網羅",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 529, tool: "npm", measuredAt: "2026-06-10",
      notes: "postcss / next の Moderate 2件は依存更新で解消済",
    },
    secretScan: { leaks: 0, commits: 9, measuredAt: "2026-05-20" },
    securityHeaders: {
      grade: "A+", score: 115, passed: 10, total: 10, measuredAt: "2026-05-20",
      notes: "nonce ベース CSP + HSTS / X-Frame-Options 等で全10テスト通過",
    },
  },
  {
    id: "snippet-sprint",
    name: "Snippet Sprint",
    description: "実コードのスニペットを1問ずつ打って学ぶプログラミング・タイピングゲーム。記号・camelCase・実コードの流れを WebGL のネオンステージで練習し、WPM・正確率・弱点分析を確認。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Game",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-06-23",
    updatedAt: "2026-06-23",
    githubUrl: "https://github.com/tktk7l9/snippet-sprint",
    githubVisibility: "public",
    liveUrl: "https://snippet-sprint.vercel.app",
    favicon: "/favicons/snippet-sprint.svg",
    technicalOverview:
      "バニラ TypeScript + Three.js 構成。タイピング判定・統計・スコア・出題は src/engine の純関数（Vitest 100%）にまとめる。コード文字は DOM、背景は入力に反応する WebGL ステージ。初期ロードを軽くするため Three.js は動的 import で遅延読込し、Vite でビルドして Vercel に静的配信。PWA（Service Worker）でオフライン対応。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ (WebGL)", sublabel: "Three.js / CodeView(DOM) / Service Worker", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "Vercel", sublabel: "静的ホスティング / CDN / CSP", kind: "edge" }] },
      ],
    },
    emoji: "⌨️",
    lighthouseScores: {
      performance: 99, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-06-23",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 47, measuredAt: "2026-06-23",
      notes: "engine(純ロジック)を100%閾値ゲート。modes/render/ui層は対象外（費用対効果）",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 73, tool: "npm", measuredAt: "2026-06-23",
      notes: "依存は three のみ（+ dev: vite/vitest/typescript）。npm audit 0件",
    },
    secretScan: { leaks: 0, commits: 3, measuredAt: "2026-06-23" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-06-23",
      notes: "Mozilla Observatory v2 全10通過。外部CSS+moduleで CSP は unsafe-inline 不使用（script-src/style-src 'self'）+ HSTS/XFO 等",
    },
  },
  {
    id: "css-atelier",
    name: "CSS Atelier",
    description: "MDN を片手に、解説→CSS記述→自動採点で学ぶインタラクティブ CSS 学習アプリ。Flexbox / Grid から :has()・container queries まで。製図スタジオ風 UI と、ボックスモデル/Flex/Grid を立体表示する 3D 概念ビジュアライザ（Three.js）付き。15トラック37レッスン。メディア/コンテナクエリは二状態（複数ビューポート）で採点。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Tool",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-06-23",
    updatedAt: "2026-06-23",
    githubUrl: "https://github.com/tktk7l9/css-atelier",
    githubVisibility: "public",
    liveUrl: "https://css-atelier.vercel.app",
    favicon: "/favicons/css-atelier.svg",
    technicalOverview:
      "バニラ TypeScript + Three.js。学習者の自由記述 CSS を同一オリジンの iframe(srcdoc) に constructable stylesheet（adoptedStyleSheets + replaceSync）で注入するため、厳格な CSP（unsafe-inline 不使用）のままライブ適用できる。採点は src/engine の純関数（Snapshot を入力）で Vitest 100%。Three.js は app チャンクに分離し初回操作で遅延読込。Vite でビルドして Vercel に静的配信、PWA でオフライン対応。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ", sublabel: "エディタ(DOM) / サンドボックス iframe(constructable stylesheet) / Three.js 概念ビジュアライザ / Service Worker", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "Vercel", sublabel: "静的ホスティング / CDN / CSP(frame-src 'self')", kind: "edge" }] },
      ],
    },
    emoji: "🎨",
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 202, measuredAt: "2026-06-23",
      notes: "engine(content/validate/tokenize/viz-map/progress)を100%閾値ゲート。sandbox/viz/ui層は presentation として対象外。全37レッスンの正答を実ブラウザ(CDP)でPASS確認",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 73, tool: "npm", measuredAt: "2026-06-23",
      notes: "依存は three のみ（+ dev: vite/vitest/typescript）。npm audit 0件",
    },
    lighthouseScores: {
      performance: 100, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-06-23",
    },
    secretScan: { leaks: 0, commits: 2, measuredAt: "2026-06-23" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-06-23",
      notes: "Mozilla Observatory v2 全10通過（A+/120）。外部CSS+moduleで CSP は unsafe-inline 不使用（script-src/style-src 'self'）+ frame-src 'self' + HSTS/XFO 等",
    },
  },
  {
    id: "glsl-atelier",
    name: "GLSL Atelier",
    description: "解説→コード記述→自動採点で学ぶインタラクティブ WebGL / Three.js 学習アプリ。GLSL フラグメントシェーダー（座標・図形・色・時間・パターン・簡易ライティング）と Three.js シーン構築（ジオメトリ/マテリアル/ライト/カメラ）を、ライブ描画しながら学ぶ。宇宙天文台風の Shader Lab UI（星雲＋bloom）。14トラック31レッスン。シェーダーは描画ピクセルの読み取り、Three.js はシーングラフの走査で採点。",
    trackedPackages: ["three", "vite", "typescript"],
    category: "Tool",
    platform: "web",
    services: ["Vercel"],
    createdAt: "2026-06-24",
    updatedAt: "2026-06-24",
    githubUrl: "https://github.com/tktk7l9/glsl-atelier",
    githubVisibility: "public",
    liveUrl: "https://glsl-atelier.vercel.app",
    favicon: "/favicons/glsl-atelier.svg",
    technicalOverview:
      "バニラ TypeScript + Three.js。学習者のコードを実際に実行して採点する。GLSL シェーダーは GPU 専用言語で任意 JS を実行しないためメインページで直接コンパイル＆描画し gl.readPixels で採点（CSP 厳格・eval 不要）。Three.js（任意 JS）は sandbox=\"allow-scripts\" の不透明オリジン iframe（/sandbox.html だけ緩和 CSP・connect-src 'none'）に隔離し、postMessage でコードを渡してシーングラフを読み戻す。採点は src/engine の純関数（Snapshot を入力）で Vitest 100%。Three.js は背景(bloom)/サンドボックスに分離して遅延読込。Vite でビルドし Vercel に静的配信、PWA 対応。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ", sublabel: "エディタ(DOM) / WebGL シェーダー実行(readPixels) / 不透明オリジン sandbox iframe(Three.js) / 宇宙背景(bloom) / Service Worker", kind: "client" }], connector: "静的アセット取得 (HTTPS)" },
        { nodes: [{ label: "Vercel", sublabel: "静的ホスティング / CDN / 厳格CSP + /sandbox.html ルート限定の緩和CSP(connect-src none)", kind: "edge" }] },
      ],
    },
    emoji: "🌌",
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 157, measuredAt: "2026-06-24",
      notes: "engine(content/validate/color/sample/tokenize/progress)を100%閾値ゲート。sandbox/viz/ui層は presentation として対象外。全31レッスンの正答を実ブラウザ(CDP)でPASS確認。サンドボックス隔離（不透明オリジンで親アクセス遮断）も実証",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 75, tool: "npm", measuredAt: "2026-06-24",
      notes: "依存は three のみ（+ dev: vite/vitest/typescript/esbuild）。npm audit 0件",
    },
    lighthouseScores: {
      performance: 100, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-06-24",
    },
    secretScan: { leaks: 0, commits: 1, measuredAt: "2026-06-24" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-06-24",
      notes: "メインは厳格CSP（unsafe-inline/eval 不使用・script-src 'self'）+ HSTS/XFO/Referrer/Permissions。/sandbox.html のみ不透明オリジン内に緩和CSP(connect-src none)を限定。Observatory はサイトルート評価のため A+ 維持",
    },
  },
  {
    id: "claude-usage-bar",
    name: "Claude Usage Bar",
    description:
      "macOS のメニューバーに Claude プランの使用率（セッション=5時間 / 週間）を常時表示する常駐アプリ。Claude Code の /usage と同じ数値をリアルタイムにグランスでき、クリックで詳細・リセット時刻（分単位）・プラン/モデル/effort・組織情報を確認できる。",
    trackedPackages: [],
    staticTech: [
      { name: "Swift", docsUrl: "https://www.swift.org/documentation/", version: "6.3" },
      { name: "SwiftUI", docsUrl: "https://developer.apple.com/documentation/swiftui", version: "—" },
      { name: "AppKit", docsUrl: "https://developer.apple.com/documentation/appkit", version: "—" },
      { name: "macOS", docsUrl: "https://developer.apple.com/documentation/", version: "14+" },
    ],
    category: "Tool",
    platform: "other",
    services: ["Anthropic Claude"],
    createdAt: "2026-06-30",
    updatedAt: "2026-06-30",
    githubUrl: "https://github.com/tktk7l9/claude-usage-bar",
    githubVisibility: "public",
    technicalOverview:
      "Swift / SwiftUI 製の常駐メニューバーアプリ（AppKit NSStatusItem + NSPopover）。macOS Keychain から Claude Code の OAuth トークンを読み、Anthropic の OAuth エンドポイント /api/oauth/usage を 60 秒ごとにポーリングして使用率を表示する（使用量を消費しないメタデータ取得）。トークン失効はローテーション事故を避けるため自動更新せず、失効前に再認証を促す。整形・パース等の純ロジックは依存ゼロのセルフテスト（52 checks）でカバーし、GitHub Actions で build + selftest を実行。SwiftPM ビルドで .app 化し、自己署名で署名を固定。",
    architecture: {
      layers: [
        { nodes: [{ label: "メニューバーアプリ (Swift/AppKit)", sublabel: "NSStatusItem 2行表示 / NSPopover / 60秒ポーリング", kind: "client" }], connector: "ローカル読取 + API取得" },
        { nodes: [
          { label: "macOS Keychain", sublabel: "Claude Code-credentials (OAuthトークン)", kind: "storage" },
          { label: "~/.claude/settings.json", sublabel: "モデル / effort", kind: "storage" },
          { label: "Anthropic OAuth API", sublabel: "/api/oauth/usage ・ /api/oauth/profile (Bearer, HTTPS)", kind: "external" },
        ] },
      ],
    },
    emoji: "📊",
    nativeQuality: {
      checks: [
        { label: "ビルド", status: "pass", detail: "swift build 警告0・エラー0" },
        { label: "CI", status: "pass", detail: "GitHub Actions: build + selftest(65)" },
        { label: "コード署名", status: "pass", detail: "自己署名・安定identity (ClaudeUsageBar Self-Signed)" },
        { label: "常駐フットプリント", status: "pass", detail: "LSUIElement / Dockアイコンなし・release 477KB" },
        { label: "配布", status: "warn", detail: "自己署名・未公証（個人/ローカル配布前提）" },
      ],
      measuredAt: "2026-06-30",
      notes: "Web ページを持たないネイティブ macOS アプリのため Lighthouse 非該当。客観的に検証できる項目のみを掲載。",
    },
    testCoverage: {
      statements: 92.38, branches: 92.38, functions: 100, lines: 99.27,
      tests: 65, measuredAt: "2026-06-30",
      notes: "swift build + llvm-cov を --selftest 実行で計測。lib層(Formatting/Models=整形・パース・色判定・JSONデコード)を網羅し functions 100% / lines 99%。UI/Keychain/UsageClient/UsageStore は表示・副作用層のため対象外。statements/branches は Swift の region coverage（XCTest/Vitest 非対応の CLT 環境のため依存ゼロの自前ランナー）",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 0, tool: "none", measuredAt: "2026-06-30",
      notes: "外部依存なし（SwiftPM・Apple標準フレームワークのみ）。OAuthトークンはKeychainから都度読み取り・非永続・非ログ",
    },
    secretScan: { leaks: 0, commits: 8, measuredAt: "2026-06-30" },
  },
];

export const categories: Category[] = ["All", "Game", "Simulator", "Tool", "Other"];
