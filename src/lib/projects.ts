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
  leaflet: {
    displayName: "Leaflet",
    docsUrl: "https://leafletjs.com/reference.html",
    versionUrl: (v) => `https://github.com/Leaflet/Leaflet/releases/tag/v${v}`,
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
  "GitHub Actions":  "https://github.com/features/actions",
  Supabase:          "https://supabase.com",
  "Anthropic Claude": "https://anthropic.com",
  "Google Gemini":   "https://ai.google.dev",
  Resend:            "https://resend.com",
  "GitHub Pages":    "https://pages.github.com",
};

export const rawProjects: RawProject[] = [
  {
    id: "service-anatomy",
    name: "Service Anatomy",
    description:
      "人気サービスを解剖する分析マガジン(日本語/英語)。1記事で1つのサービスを取り上げ、サービス解説・UX分析・技術構成の推定・ビジネスモデルの4面から公開情報ベースで読み解く。解剖スコア(4軸)・確度3段階の技術構成テーブル・事実/推測の明示ラベル・出典リスト付き。初期記事はめっちゃカメレオン/Nani翻訳/家族アルバム みてねの3本。",
    trackedPackages: ["next", "react", "unified"],
    category: "Other",
    platform: "web",
    services: ["Vercel", "Vercel Analytics"],
    createdAt: "2026-07-16",
    updatedAt: "2026-07-16",
    githubUrl: "https://github.com/tktk7l9/service-anatomy",
    githubVisibility: "public",
    liveUrl: "https://service-anatomy.vercel.app",
    favicon: "/favicons/service-anatomy.svg",
    technicalOverview:
      "Next.js 16 (App Router) + React 19。全HTMLルートをforce-dynamic + per-request nonce CSP(proxy.ts)で配信しObservatory A+。記事はcontent/articles/<slug>/{ja,en}.mdのgray-matter frontmatter(解剖スコア・techStack確度3段階・出典)+remark-directive拡張(:::fact/:::guess/:::pull/::scorecard/::techstack)。ディレクティブはマーカーdiv化→純関数split→Reactコンポーネントをinterleave描画(dangerouslySetInnerHTML内にコンポーネントを差し込む問題を回避)。ja/enの言語中立フィールド等価・confirmedへの一次情報URL必須をcontent.test.tsがCI強制。ヒーローは著作権フリーのシード生成SVG解剖図。エディトリアルデザイン(欧文セリフNewsreader約2KBのみWebフォント・JP明朝はシステム=LH perf 72→99の実測知見)。RSS 2.0/sitemap(hreflang)/BlogPosting JSON-LD/記事別動的OG(スコア入り雑誌表紙風)。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ", sublabel: "静的HTML中心(クライアントJS最小) / light-dark自動 / 言語切替", kind: "client" }], connector: "HTTPS" },
        { nodes: [{ label: "Vercel", sublabel: "Next.js SSR(force-dynamic) / proxy.tsでnonce CSP発行 / 記事md実行時読込(outputFileTracingIncludes)", kind: "edge" }], connector: "remark/rehype+directive変換" },
        { nodes: [{ label: "GitHub Actions", sublabel: "CI(gitleaks/audit/typecheck/coverage100%/build/Lighthouseガード)", kind: "server" }] },
      ],
    },
    emoji: "🔬",
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 163, measuredAt: "2026-07-16",
      notes: "engine(markdown/articles/seo/feed/format)+i18n層を100%閾値ゲート。content.test.tsが全記事の横断整合性(ja/en言語中立フィールド等価・出典https+閲覧日・スコア0-5/0.5刻み・confirmed技術に一次情報URL必須・h2 4本以上・scorecard/techstack各1回・CJK括弧隣接の強調失敗検出)をCI強制。記事を追加すると自動でテスト対象に入る",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 0, tool: "npm", measuredAt: "2026-07-16",
      notes: "npm audit --audit-level=low 0件(postcssをoverridesで8.5.10+に固定)。CIにgitleaks/npm audit/Lighthouseリグレッションガードを組み込み済み",
    },
    lighthouseScores: {
      performance: 99, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-07-16",
    },
    secretScan: { leaks: 0, commits: 10, measuredAt: "2026-07-16" },
    securityHeaders: {
      grade: "A+", score: 115, passed: 10, total: 10, measuredAt: "2026-07-16",
      notes: "Mozilla Observatory v2。per-request nonce CSP(strict-dynamic)+セキュリティヘッダー一式。desktop Lighthouseは100/100/100/100(mobileはperf 99)",
    },
  },
  {
    id: "lumen-bloom",
    name: "Lumen Bloom",
    description:
      "現在地の太陽・月の位置と天気をリアルタイムに映す、常時起動できる3Dウォールペーパー。部屋の隅の花瓶には週替わりでその季節の花や枝物（ひまわり・バラ・チューリップ・コスモス・アネモネ・ガーベラ・マーガレット・芍薬・ダリア・マム・カーネーション・ラナンキュラス・紫陽花・水仙・ユリ・ラベンダー・かすみ草・リンドウ・カラー・梅・桜・ミモザ・紅葉・南天・ドウダンツツジの全25種を月3〜4候補で循環、花に合わせて透明/ロゼ/コバルト/スモークガラス・白磁/青磁/黒陶/テラコッタの陶器・真鍮の花瓶も変化、南半球は季節6ヶ月シフト）が生けられ、窓格子越しの実太陽光が桟の影ごと床と壁に落ち、夜は月齢に応じた月明かり。天気（晴れ/曇り/霧/雨/雪/雷雨）は空の色・霧・雨雪パーティクル・稲光・床の積雪・氷点下のガラスの曇りとして反映され、時刻・天気・今週の花・月相のHUDと画面スリープ防止（Wake Lock）で置き時計のようにも使える。URLパラメータで任意の場所・時刻・アレンジを固定して共有可能。",
    trackedPackages: ["vite", "typescript", "three"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Vercel Analytics"],
    createdAt: "2026-07-14",
    updatedAt: "2026-07-15",
    githubUrl: "https://github.com/tktk7l9/lumen-bloom",
    githubVisibility: "public",
    liveUrl: "https://lumen-bloom.vercel.app",
    favicon: "/favicons/lumen-bloom.svg",
    emoji: "🌻",
    technicalOverview:
      "天体計算は依存ゼロの自前実装（Meeus準拠: 太陽ch.25 ~0.01°/月ch.47 truncated ~0.05°/月相ch.48、skydialから移植しJPL Horizons・USNOとfixture突合）。ひまわりは完全プロシージャル（種盤はVogelフィロタキシス=黄金角螺旋170小花、花びら/萼/葉は同一のパラメトリック曲面グリッドのプロポーション違い、シード付きmulberry32で決定論的レイアウト）で外部3Dアセット不使用。窓格子はカメラ不可視（colorWrite/depthWrite無効）のalphaTestゴボ板が太陽方向に追従してシャドウマップにのみ寄与。水はtransmissionガラス内で見えるようクラシックalpha透過+ガラスdepthWrite無効の合成。天気はOpen-Meteo（キー不要）をWMOコード→ムードにマッピングし、全照明量を指数スムージング（τ≈2s）で遷移。常時稼働向けに適応フレームレート（パーティクル/稲光時のみ30fps、平常時10fps）・昼夜で不要な影パスを丸ごと停止・タブ非表示で全ループ停止。IBL（RoomEnvironment）は昼夜カーブに連動させ深夜が正午のように光る罠を回避。",
    architecture: {
      layers: [
        {
          nodes: [
            {
              label: "ブラウザ (Vanilla TS)",
              sublabel: "Meeus太陽/月計算 / プロシージャルひまわり / 窓ゴボ+適応fps / HUD・WakeLock",
              kind: "client",
            },
          ],
          connector: "静的配信 + 天気GET (HTTPS)",
        },
        {
          nodes: [
            { label: "Vite · Vercel", sublabel: "厳格CSP / PWA(SW) / URLパラメータ共有", kind: "edge" },
            { label: "Open-Meteo", sublabel: "connect-src限定許可 (天体計算は全てローカル)", kind: "external" },
          ],
        },
      ],
    },
    lighthouseScores: {
      performance: 92, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-07-14",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 191, measuredAt: "2026-07-15",
      notes: "純ロジック層(astro太陽/月/月相・フィロタキシス/花びら曲面/花瓶プロファイル/花束レイアウト・天気クライアント/WMOマッピング/staleness・シーン状態導出・URLパラメータ)を100%閾値ゲート。天体計算はMeeus例題+JPL Horizons(~0.01°)+USNO輝面比(±5%)で突合。Three.js/DOM層は対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 124, tool: "npm", measuredAt: "2026-07-14",
      notes: "npm audit 0件。実行時依存はthree/@vercel/analyticsのみ（天体計算・天気マッピングは自前）",
    },
    secretScan: { leaks: 0, commits: 20, measuredAt: "2026-07-14" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-07-14",
      notes: "Mozilla Observatory v2 満点。Lighthouseはdesktop 99/100/100/100・mobile 92/100/100/100（常時3D描画のTBTは適応fpsで280msまで削減）",
    },
  },
  {
    id: "agent-cockpit",
    name: "Agent Cockpit",
    description:
      "AI コーディングエージェントの設定を1画面で横断管理する macOS デスクトップアプリ。Claude Code（~/.claude.json・~/.claude/）・OpenAI Codex（~/.codex/config.toml）・Cursor（~/.cursor/）＋プロジェクトスコープ（.mcp.json・.claude/）に分散した MCP サーバー / Skill / Subagent / スラッシュコマンド / プラグイン / 設定 / AGENTS.md・CLAUDE.md を統合インベントリとして表示し、GUI からフル編集（追加・編集・削除・リネーム・トグル）できる。全書込は 差分プレビュー（env 値マスク）→ sha256 競合検知 → ファイル毎50世代バックアップ → atomic write（パーミッション保持）の同一パイプラインを通り、~/.codex/auth.json や .env* は IPC 層でハード拒否。外部エディタや各 CLI 本体による変更は chokidar 監視で即座に反映される。",
    trackedPackages: [],
    staticTech: [
      { name: "Electron", docsUrl: "https://www.electronjs.org/docs/latest", version: "43" },
      { name: "React", docsUrl: "https://react.dev", version: "19" },
      { name: "TypeScript", docsUrl: "https://www.typescriptlang.org/docs/", version: "6.0" },
      { name: "electron-vite", docsUrl: "https://electron-vite.org", version: "5" },
      { name: "CodeMirror", docsUrl: "https://codemirror.net/docs/", version: "6" },
      { name: "macOS", docsUrl: "https://developer.apple.com/documentation/", version: "arm64" },
    ],
    category: "Tool",
    platform: "other",
    services: ["GitHub Actions"],
    createdAt: "2026-07-07",
    updatedAt: "2026-07-07",
    githubUrl: "https://github.com/tktk7l9/agent-cockpit",
    githubVisibility: "public",
    favicon: "/favicons/agent-cockpit.svg",
    emoji: "🎛️",
    technicalOverview:
      "Electron（electron-vite + React 19 + zustand + CodeMirror 6）。全ロジックを純関数の lib 層（FileSnapshot→FileEdit 変換・fs/Electron 非依存）に隔離し、書込は planMutation に一本化 — これにより lib を plain node の vitest で 100% カバレッジゲートできる。設定ファイルは絶対に全体再直列化しない: JSON は jsonc-parser の modify/applyEdits によるテキスト編集（~/.claude.json の約70個の無関係キー・整形をバイト単位で保存）、TOML は toml-eslint-parser の AST レンジを外科的にスプライス（コメント生存）、markdown frontmatter は yaml Document API。main プロセスは薄い fs ゲートウェイで、realpath 二重チェックのパス allowlist・auth.json/.env* denylist・バックアップ・atomic write を担う。renderer は contextIsolation + sandbox + 厳格 CSP + 型付き contextBridge API 1本のみ（リモートコンテンツなし）。",
    architecture: {
      layers: [
        {
          nodes: [
            { label: "Renderer (React 19)", sublabel: "統合インベントリ / 各種エディタ / 差分モーダル / CodeMirror 6", kind: "client" },
          ],
          connector: "型付き contextBridge API (window.cockpit) — contextIsolation + sandbox",
        },
        {
          nodes: [
            { label: "Main: 純関数 lib", sublabel: "planMutation / jsonc・TOML 外科的編集 / inventory（100%ゲート）", kind: "server" },
            { label: "Main: fs-gateway", sublabel: "パスallowlist / 50世代バックアップ / atomic write / chokidar 監視", kind: "server" },
          ],
        },
        {
          nodes: [
            { label: "Claude Code", sublabel: "~/.claude.json / ~/.claude/ / .mcp.json", kind: "storage" },
            { label: "Codex", sublabel: "~/.codex/config.toml（コメント保存・0600維持）", kind: "storage" },
            { label: "Cursor", sublabel: "~/.cursor/mcp.json / skills / agents", kind: "storage" },
          ],
        },
      ],
    },
    nativeQuality: {
      checks: [
        { label: "ビルド", status: "pass", detail: "tsc --noEmit（node/web 2プロジェクト）+ electron-vite build 警告0" },
        { label: "CI", status: "pass", detail: "GitHub Actions: typecheck + lib 100%カバレッジゲート + build + npm audit（ubuntu）/ dmg アーティファクト（macos-14）" },
        { label: "書込安全性", status: "pass", detail: "差分プレビュー→sha256競合検知→バックアップ→atomic write。no-op変異バイト同一の不変条件テストで回帰防御" },
        { label: "Electronセキュリティ", status: "pass", detail: "contextIsolation / sandbox / nodeIntegration off / 厳格CSP / navigation全拒否 / IPCパスallowlist + 機微ファイルdenylist" },
        { label: "配布", status: "warn", detail: "未署名・未公証（Developer ID なし）。初回起動は右クリック→開く、または xattr -dr com.apple.quarantine" },
      ],
      measuredAt: "2026-07-07",
      notes: "Web ページを持たないネイティブ macOS アプリのため Lighthouse / Observatory 非該当。客観的に検証できる項目のみを掲載。",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 152, measuredAt: "2026-07-07",
      notes: "vitest + @vitest/coverage-v8。純関数の src/lib（パーサ・外科的エディタ・planMutation・inventory・validate/diff/redact）を 100/100/100/100 の閾値ゲート（CIで強制）。main の書込パイプライン（バックアップ・atomic・競合検知・symlink脱出拒否）は実テンポラリファイルで9テスト。UI層は対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 503, tool: "npm", measuredAt: "2026-07-07",
      notes: "全依存 devDependencies（main もバンドル）= 配布物は out/ のみで node_modules を同梱しない。実行時のネットワーク通信ゼロ・シークレット非保持",
    },
    secretScan: { leaks: 0, commits: 1, measuredAt: "2026-07-07" },
  },
  {
    id: "roba-hud",
    name: "RoBaHUD",
    description:
      "roBa（ZMK 分割キーボード・右手トラックボール）専用の macOS フローティング HUD。実配置の43キーをレイヤー別に常時最前面表示し、roBa の打鍵だけをリアルタイムハイライト。レイヤーキーのホールドはファームウェア側の隠しマーカー（F21–F24 = macOS に仮想キーコードが無くアプリからは不可視、生 HID 購読にだけ届く）で正確に検知し、ホールドした瞬間にそのレイヤーの配置へ表示が切り替わる。マーカーの無い経路はキーコード逆引き＋トラックボール検知で推定。⌥⌘K グローバルホットキー・コンパクトバー表示・クリック透過、打鍵ヒートマップ、左右それぞれのバッテリー監視（HUD内チップ＋メニューバー常時表示(2行/1行)・履歴グラフ・放電レートから残り日数予測・低残量/切断通知・ログイン時自動起動 = zmk-battery-center 相当）に加え、GUI からキーを選んで .keymap を書き換え → CHEATSHEET.md の配置図を自動再生成 → commit & push → GitHub Actions ビルド監視 → UF2 自動ダウンロード → 書き込みガイドまでの一気通貫パイプラインを備える。",
    trackedPackages: [],
    staticTech: [
      { name: "Swift", docsUrl: "https://www.swift.org/documentation/", version: "6.3" },
      { name: "SwiftUI", docsUrl: "https://developer.apple.com/documentation/swiftui", version: "—" },
      { name: "IOKit HID", docsUrl: "https://developer.apple.com/documentation/iokit", version: "—" },
      { name: "macOS", docsUrl: "https://developer.apple.com/documentation/", version: "14+" },
    ],
    category: "Tool",
    platform: "other",
    services: ["GitHub Actions"],
    createdAt: "2026-07-02",
    updatedAt: "2026-07-03",
    githubUrl: "https://github.com/tktk7l9/roba-hud",
    githubVisibility: "public",
    emoji: "🖲️",
    technicalOverview:
      "Swift / SwiftUI 製（依存ゼロ・SwiftPM）。非アクティブ化 NSPanel を全 Spaces / フルスクリーン上に常時最前面表示する。zmk-config-roBa の .keymap（devicetree）を独自トークナイザでソース範囲付きパースし、roBa.json の座標（親指キーの回転含む）で描画。IOHIDManager が roBa デバイスのみ購読し（Product 文字列で識別・BLE 単一デバイス）、(page,usage)→(layer,pos) 逆引き＋トラックボール移動/スクロール検知＋暗黙シフト抑制の状態機械で表示レイヤーを推定する。バッテリーは CoreBluetooth で既存 HID ボンドに相乗りし、標準 Battery Service (0x180F) の複数キャラクタリスティックを CUD \"Peripheral N\"（ZMK の CENTRAL_BATTERY_LEVEL_PROXY）で左右に識別して購読、履歴を Swift Charts で描画。編集は記録済みソース範囲の外科的置換（列揃え維持・書込前に再パース検証）で、git/gh を Process 実行して push→Actions 監視→UF2 取得まで自動化。",
    architecture: {
      layers: [
        {
          nodes: [
            { label: "フローティングHUD (Swift/SwiftUI)", sublabel: "NSPanel 常時最前面 / レイヤー推定 / ヒートマップ / 編集UI", kind: "client" },
          ],
          connector: "生HID購読 (IOHIDManager) / keymap 読み書き / git・gh 実行",
        },
        {
          nodes: [
            { label: "roBa (BLE)", sublabel: "HID (NKRO/consumer/trackball) + GATT Battery Service ×左右", kind: "external" },
            { label: "zmk-config-roBa", sublabel: "roBa.keymap / roBa.json（正本）", kind: "storage" },
            { label: "GitHub Actions", sublabel: "ZMK ビルド → UF2 artifact (gh CLI)", kind: "build" },
          ],
        },
      ],
    },
    nativeQuality: {
      checks: [
        { label: "ビルド", status: "pass", detail: "swift build 警告0・エラー0" },
        { label: "CI", status: "pass", detail: "GitHub Actions: build + selftest(254) + lib行100%カバレッジゲート" },
        { label: "コード署名", status: "pass", detail: "自己署名・安定identity (RoBaHUD Self-Signed) — Input Monitoring 権限維持に必須" },
        { label: "常駐フットプリント", status: "pass", detail: "LSUIElement / release ~1.5MB / 実測 アイドルCPU 0.0%・RSS ~103MB（推定タイマーはアイドル時停止）" },
        { label: "配布", status: "warn", detail: "自己署名・未公証（個人/ローカル配布前提）。Input Monitoring の TCC 許可が必要" },
      ],
      measuredAt: "2026-07-02",
      notes: "Web ページを持たないネイティブ macOS アプリのため Lighthouse 非該当。客観的に検証できる項目のみを掲載。",
    },
    testCoverage: {
      statements: 99.14, branches: 99.14, functions: 100, lines: 100,
      tests: 278, measuredAt: "2026-07-03",
      notes: "swift build + llvm-cov を --selftest 実行で計測（Swift の region coverage を statements/branches に記載）。lib 10ファイル（Parser/Editor/Model/KeycodeTable/InferenceEngine/Geometry/Stats/BatteryModel/BatteryForecast/CheatsheetGenerator）を行100%の閾値ゲート（scripts/coverage-gate.sh・CIで強制）。UI・HID/BLE 購読・git/gh 実行層は副作用層のため対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 0, tool: "none", measuredAt: "2026-07-02",
      notes: "外部依存なし（SwiftPM・Apple 標準フレームワークのみ）。git/gh はユーザー環境の CLI を Process 実行し、トークン類は一切保持しない",
    },
    secretScan: { leaks: 0, commits: 6, measuredAt: "2026-07-02" },
  },
  {
    id: "chronoscroll",
    name: "chronoscroll",
    description:
      "1868（明治）〜現在の国内外の歴史ニュース27,014件を、縦の無限スクロール年表で探索できるWebサイト。地図のようにズームすると表示が変わる「セマンティックズーム」で、概観では各時代の重大ニュース（オリジナルSVGピクトグラム106点付き）だけ、拡大すると月・日レベルの細かい出来事まで現れる。クリックで画像・要約・Wikipedia出典リンク・関連するできごとへのリンクを表示（同じ実体を出典に持つイベント同士を自動で結びつけ、10,666件・全体の約39%に付与）。地域（日本/世界）×8カテゴリのフィルタ、日本語全文検索、和暦併記、ミニマップ、年代ジャンプ、URL共有、ダークモード対応、開閉・出現アニメーション。全27,014件を個別ページとしてprerenderしsitemap配信（ロングテールSEO、関連リンクで内部リンク網も強化）。ChatGPT・AlphaGo・DeepSeekショックなど生成AI/テック史も収録し、その系譜を関連リンクで手動接続。",
    trackedPackages: ["svelte", "@sveltejs/kit", "vite", "typescript", "minisearch"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Vercel Analytics"],
    createdAt: "2026-07-10",
    updatedAt: "2026-07-12",
    githubUrl: "https://github.com/tktk7l9/chronoscroll",
    githubVisibility: "public",
    liveUrl: "https://chronoscroll.vercel.app",
    favicon: "/favicons/chronoscroll.svg",
    emoji: "⌛",
    technicalOverview:
      "Svelte 5 (runes) + SvelteKit + adapter-static。データはビルド時パイプラインが ja.wikipedia「YYYY年」+「YYYY年の日本」の2シリーズ・計318頁の「できごと」をパースし、max(Wikidata sitelinks, jaページビュー/10)×IDF減衰×地名減衰→十年内パーセンタイル正規化で注目度をスコアリング（ja版の記事分割でsitelinksが過小になる問題をページビュー併用で補正）。2シリーズ間の近似重複は文字bigram Jaccard＋内部リンク実体の重なりガード付きcontainment判定（union-findで推移的クラスタ化）で261件を自動集約——「同日に成立した別々の法律」のような定型文パターンでの誤統合を防ぎつつ表現違いの同一ニュースを1件に。関連イベントは各イベントの出典URLからWikipedia記事の正規タイトルを復元し、同じ実体を出典に持つイベント同士を自動で結びつける（地名的記事は除外し誤結合を防止）ことで実現、curated側でもrelatedIdsによる手動指定で補強可能（AI・テック史41件はChatGPT⇄GPT-3/4/Transformer論文等の系譜を手動接続）。生成27,014件は overview+可変チャンク（十年、過密な十年は5年分割）の静的JSONとしてコミットし可視範囲を遅延ロード。年表はネイティブスクロール+高さスペーサーの仮想化で、LOD閾値（表示密度一定・フィルタ選択率で補正）+ピクセル密度cap+カード衝突回避レイアウトを純関数で実装。概観〜十年ズームはimportanceThresholdがoverview.jsonのカットオフを上回りチャンクデータが画面に一切寄与しないと判明したため、必要になるまでチャンクのフェッチ自体を止める最適化も実施（初期表示のチャンクフェッチを実測0件に）。検索はMiniSearch(文字bigram)をWeb Workerで遅延構築。編集層はYAMLキュレーション391件（トップ423件を人手レビュー: demote215/分類修正113/要約リライト+AI・テック史新規追加41件、SVG106点はcurrentColorでテーマ・カテゴリ色に自動追従する統一線画スプライト）。全イベントをcsr=falseの純静的HTMLとしてprerender（+sitemap.xml、前後ナビ・関連リンクで内部リンク網を強化）。ダイアログ開閉・カード出現・ズームゲージ等はtransform/opacityのみのcompositorアニメーションでprefers-reduced-motion尊重。厳格CSPとSvelteKitの両立は、起動インラインスクリプトのpost-build外部化+ルートアナウンサーstyle属性のsha256ハッシュ許可で実現。CIは本番同等CSPヘッダー配信での実ブラウザスモーク17シナリオ付き。データは月次cronのGitHub ActionsがPRを自動作成して更新。",
    architecture: {
      layers: [
        {
          nodes: [
            {
              label: "ブラウザ (Svelte 5)",
              sublabel: "仮想化年表 / LODズーム / MiniSearch Worker / URL状態",
              kind: "client",
            },
          ],
          connector: "静的配信 + JSONチャンクGET (HTTPS)",
        },
        {
          nodes: [
            {
              label: "SvelteKit static · Vercel",
              sublabel: "厳格CSP / 27,014件を25チャンク配信",
              kind: "edge",
            },
            {
              label: "Wikipedia / Wikidata",
              sublabel: "ビルド時のみ取得 (実行時は画像サムネのみ)",
              kind: "external",
            },
          ],
        },
      ],
    },
    lighthouseScores: {
      performance: 99, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-07-12",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 212, measuredAt: "2026-07-12",
      notes: "純ロジック層(src/lib: 時間スケール/LOD/仮想化/レイアウト/フィルタ/URL状態/検索/和暦 + pipeline/lib: wikitextパーサー/スコアリング/分類/キュレーション/近似重複排除/関連イベント算出)を100%閾値ゲート。実ブラウザスモーク17シナリオ(ズーム/詳細/フィルタ/検索ジャンプ/URL復元/モバイル/年代ジャンプ/個別ページ/ズームゲージ)をCI+本番URLでPASS。UIコンポーネント層は対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 165, tool: "npm", measuredAt: "2026-07-10",
      notes: "npm audit 0件（cookieはoverrideで^0.7.2に固定）。実行時依存はminisearch/@vercel/analyticsのみ",
    },
    secretScan: { leaks: 0, commits: 20, measuredAt: "2026-07-12" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-07-10",
      notes: "Mozilla Observatory v2 満点。Lighthouseはmobile/desktopとも100/100/100/100（LCP 1.7s・CLS 0）",
    },
  },
  {
    id: "skydial",
    name: "Skydial",
    description:
      "太陽と月の位置・日の出日没・薄明・ゴールデンアワー・月齢を、3Dドーム/地図/ARで確認できるトラッカーPWA。ドーム内では自宅の寸法・屋根・窓・隣家をパラメトリックに入力し、影の落ち方と窓ごとの日射取得熱量(kWh)を晴天モデルで可視化。屋根を半透明にしたカットアウェイで、室内のどこまで日射が届くか(床の日向パッチ・侵入距離・照射面積)も3D表示(パッシブデザイン検討向け)。日時スクラバーで過去未来の空を探索でき、状態はURLで共有可能。日本語/英語対応。",
    trackedPackages: ["vite", "typescript", "three", "leaflet"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Vercel Analytics"],
    createdAt: "2026-07-07",
    updatedAt: "2026-07-08",
    githubUrl: "https://github.com/tktk7l9/skydial",
    githubVisibility: "public",
    liveUrl: "https://skydial.vercel.app",
    favicon: "/favicons/skydial.svg",
    emoji: "🌗",
    technicalOverview:
      "天体計算は依存ゼロの自前実装（Meeus準拠: 太陽ch.25 ~0.01°/月ch.47 truncated+視差 ~0.05°/月相ch.48、朔望・夏至冬至は離角/黄経クロッシングを二分法で求解）で、JPL Horizons・USNO・国立天文台こよみとfixture突合済み。日射取得シミュレーションはIneichen–Perez晴天モデル+Hay–Davies傾斜面散乱（pvlib-python生成fixtureと0.1%突合）、遮蔽は建物・屋根・軒・隣家を三角形メッシュ化しMöller–Trumboreでレイトレース（表示用Three.jsメッシュと計算用ジオメトリは同一ソース）。室内可視化は窓4隅を太陽方向へ床面投影しSutherland–Hodgmanで建物footprintにクリップする幾何計算(建物全体を1部屋として扱う簡略化)。Three.jsドームとLeaflet地図はタブ初回表示時の動的import（初期17.4kB gzip）。ARはRz(α)Rx(β)Ry(γ)回転行列で任意姿勢の視線方位/ピッチ/ロールを算出し、Android磁北には国土地理院 磁気図2020.0近似式で真北補正（日本域）。厳格CSP+Permissions-Policy(camera/geolocation/センサー=self)のままPWAオフライン動作（地図タイルのみ要ネット）。",
    architecture: {
      layers: [
        {
          nodes: [
            {
              label: "ブラウザ (Vanilla TS)",
              sublabel: "Meeus天体計算 / Three.jsドーム / Leaflet / AR(センサー+Canvas2D)",
              kind: "client",
            },
          ],
          connector: "静的配信 + タイルGET (HTTPS)",
        },
        {
          nodes: [
            { label: "Vite · Vercel", sublabel: "厳格CSP / PWA(SW) / URL状態共有", kind: "edge" },
            { label: "OSM / 地理院タイル", sublabel: "img-src限定許可 (計算は全てローカル)", kind: "external" },
          ],
        },
      ],
    },
    lighthouseScores: {
      performance: 100, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-07-08",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 309, measuredAt: "2026-07-08",
      notes: "純ロジック層(astro/state/i18n/測地/AR姿勢・投影/朔望ソルバー/偏角/TZ推定/日射sunsim一式+室内床パッチ幾何)を100%閾値ゲート。天体計算はJPL Horizons(0.002°一致)・USNO(出没±75s・朔望±10分)・極夜白夜/月の出なし日エッジ込みで突合。日射はpvlib-python生成fixtureと0.1%突合+物理不変量(冬至南面>夏至南面・冬至の床侵入深さ>夏至等)。UI/Three/Leaflet層は対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 107, tool: "npm", measuredAt: "2026-07-08",
      notes: "npm audit 0件。実行時依存はthree/leaflet/@vercel/analyticsのみ（天体計算・日射計算は自前）",
    },
    secretScan: { leaks: 0, commits: 23, measuredAt: "2026-07-08" },
    securityHeaders: {
      grade: "A+", score: 120, passed: 10, total: 10, measuredAt: "2026-07-08",
      notes: "Mozilla Observatory v2 満点。デスクトップLighthouseも100/100/100/100",
    },
  },
  {
    id: "utility-tracker",
    name: "光熱費トラッカー",
    description:
      "電気(TEPCO)・ガス(LPIO)・水道(東京都水道局)の料金と使用量を1か所に集約し、月別料金の推移・合計、使用量と実効単価、前年同月比・季節性をグラフで可視化する個人用ダッシュボード。CSV取込＋手入力で登録し、Supabase にクラウド同期。",
    trackedPackages: ["next", "react", "typescript", "@supabase/supabase-js"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Vercel Analytics", "Supabase"],
    createdAt: "2026-07-01",
    updatedAt: "2026-07-01",
    githubUrl: "https://github.com/tktk7l9/utility-tracker",
    githubVisibility: "public",
    liveUrl: "https://utility-tracker-sigma.vercel.app",
    emoji: "💡",
    technicalOverview:
      "Next.js App Router（クライアント描画のデータ端末、noindex）。集計の心臓部は src/lib の純関数（Vitest 100%）で、隔月請求の水道はカレンダー月へ日割り按分して月次系列に正規化する。CSV は文字コード選択(UTF-8/Shift_JIS)＋列マッピングで正規化し、unique(種別,期間)で冪等取込。保存は Supabase(Postgres)、認証はメール+パスワードの単一ユーザーで RLS を適用。グラフは recharts。",
    architecture: {
      layers: [
        {
          nodes: [
            { label: "ブラウザ (React 19)", sublabel: "recharts / CSV正規化 / supabase-js", kind: "client" },
          ],
          connector: "REST / Auth (HTTPS)",
        },
        {
          nodes: [
            { label: "Next.js · Vercel", sublabel: "静的配信 / CSP(connect-src supabase)", kind: "edge" },
            { label: "Supabase", sublabel: "Postgres(readings) / Auth / RLS", kind: "storage" },
          ],
        },
      ],
    },
    lighthouseScores: {
      performance: 100, accessibility: 100, bestPractices: 100, seo: 60,
      measuredAt: "2026-07-01",
    },
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 71, measuredAt: "2026-07-01",
      notes: "lib層(aggregate/csv/domain/export/utils)を100%閾値ゲート。supabase.ts(ネットワーク)とUIは対象外",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 522, tool: "npm", measuredAt: "2026-07-01",
      notes: "npm audit 0件（TypeScript 6.0.3 / supabase-js 2.110.0 更新後も維持）。postcss/undici を overrides で更新",
    },
    secretScan: { leaks: 0, commits: 8, measuredAt: "2026-07-01" },
    securityHeaders: {
      grade: "B+", score: 80, passed: 9, total: 10, measuredAt: "2026-07-01",
      notes: "Mozilla Observatory v2 で 9/10。CSP は recharts / Next のインライン用に script-src 'unsafe-inline' を許容しており CSP 項目で減点（A+ 化には nonce 化が必要）",
    },
  },
  {
    id: "lifeplan-simulator",
    name: "ライフプランシミュレーター",
    description: "収入・支出・住宅・ライフイベント・投資を入力して老後（100歳まで）の資産推移をシミュレーション。",
    trackedPackages: ["next", "react", "three", "@anthropic-ai/sdk"],
    category: "Simulator",
    platform: "web",
    services: ["Vercel", "Vercel Analytics", "Anthropic Claude"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics", "Supabase", "Google Gemini", "Resend"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics", "Supabase"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
    services: ["Vercel", "Vercel Analytics"],
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
  {
    id: "ai-primer",
    name: "AI Primer",
    description:
      "AIの用語・歴史・仕組み・使い方を体系的に学べるバイリンガル(日本語/英語)チュートリアル。ChatGPT・Claude・Gemini・Grokの比較からコーディングAI・画像/動画/音楽生成・活用と倫理まで8トラック40レッスン。各レッスンに確認クイズと出典リンク、最終確認日バッジ付き。モデルカタログ・AI年表・用語集も収録。",
    trackedPackages: ["next", "react", "unified"],
    category: "Tool",
    platform: "web",
    services: ["Vercel", "Vercel Analytics"],
    createdAt: "2026-07-15",
    updatedAt: "2026-07-15",
    githubUrl: "https://github.com/tktk7l9/ai-primer",
    githubVisibility: "public",
    liveUrl: "https://ai-primer-nine.vercel.app",
    favicon: "/favicons/ai-primer.svg",
    technicalOverview:
      "Next.js 16 (App Router) + React 19。CSPはacro-finder方式のper-request nonce(proxy.ts、force-dynamic)でObservatory A+を維持しつつSSR。i18nは手書き([locale]セグメント+Localized<T>型で翻訳漏れを型エラー化、middleware不使用)。コンテンツは1レッスン=1ファイルの純データ(src/engine/content)、本文はMarkdownをremark/rehype(+remark-gfm)でビルド時HTML変換しクライアントJSを最小化。クイズは判別共用体(single/multi/boolean/order)+純関数evaluate。進捗はuseSyncExternalStore経由のlocalStorage。鮮度は各項目のlastVerifiedを可視化し、月次GitHub Actionsが出典リンク死活+90日超過をIssue化(本文更新は人手)。",
    architecture: {
      layers: [
        { nodes: [{ label: "ブラウザ", sublabel: "クイズ(useSyncExternalStore)/進捗ローカルストレージ/言語切替", kind: "client" }], connector: "HTTPS" },
        { nodes: [{ label: "Vercel", sublabel: "Next.js SSR(force-dynamic) / proxy.tsでnonce CSP発行 / CDN", kind: "edge" }], connector: "Markdownビルド時変換" },
        { nodes: [{ label: "GitHub Actions", sublabel: "CI(typecheck/coverage/build) / 月次鮮度チェック→Issue化", kind: "server" }] },
      ],
    },
    emoji: "🧭",
    testCoverage: {
      statements: 100, branches: 100, functions: 100, lines: 100,
      tests: 397, measuredAt: "2026-07-15",
      notes: "engine(content/quiz/progress/freshness/markdown)+i18n層を100%閾値ゲート。content.test.tsが40レッスン+モデル15件+年表25件+用語21語の整合性(id一意・ja/en非空・出典https・lastVerified妥当・日付昇順等)を横断検証。加えてquiz-block中心にUIコンポーネント層のテスト29本(jsdom+testing-library)を追加し、locale-switcherの実装バグ(pathname未検出時のフォールバック不備)を検出・修正",
    },
    securityScores: {
      score: 100, critical: 0, high: 0, moderate: 0, low: 0,
      totalDependencies: 0, tool: "npm", measuredAt: "2026-07-15",
      notes: "npm audit --audit-level=low 0件(postcssをoverridesで8.5.10+に固定しNext 16同梱分の脆弱性を回避)。CIにgitleaks/npm audit/Lighthouseリグレッションガードを組み込み済み",
    },
    lighthouseScores: {
      performance: 100, accessibility: 100, bestPractices: 100, seo: 100,
      measuredAt: "2026-07-15",
    },
    secretScan: { leaks: 0, commits: 30, measuredAt: "2026-07-15" },
    securityHeaders: {
      grade: "A+", score: 115, passed: 10, total: 10, measuredAt: "2026-07-15",
      notes: "Mozilla Observatory v2。acro-finder方式のper-request nonce CSP(strict-dynamic)+セキュリティヘッダー一式",
    },
  },
];

export const categories: Category[] = ["All", "Game", "Simulator", "Tool", "Other"];
