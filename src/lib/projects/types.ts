export type Category = "All" | "Game" | "Simulator" | "Tool" | "Other";

/** Platform kind. Distinguishes web apps, Chrome extensions and others */
export type Platform = "web" | "chrome-extension" | "other";

export type TechVersion = {
  name: string;
  docsUrl: string;
  version: string;
  versionUrl?: string;
  /**
   * true when the package.json declaration is a range such as `^16.2.10`.
   * version is then the lower bound of the range, not the version actually resolved,
   * so it cannot be used for OSV vulnerability lookups (it would falsely flag the lower bound's vulnerabilities).
   */
  versionIsRange?: boolean;
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
  /** Total number of tests */
  tests: number;
  /** ISO date */
  measuredAt: string;
  /** Scope note (e.g. "lib 100% / 全体 80%") */
  notes?: string;
};

/** Security score based on npm/pnpm audit.
 *  score = max(0, 100 - 25*critical - 10*high - 3*moderate - 1*low) */
export type SecurityScores = {
  /** 0..100 */
  score: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  /** Number of dependencies scanned by audit (production + dev) */
  totalDependencies: number;
  /** "npm" | "pnpm", etc. */
  tool: "npm" | "pnpm" | "none";
  /** ISO date */
  measuredAt: string;
  notes?: string;
};

/** Secrets scan result from gitleaks (including git history) */
export type SecretScan = {
  /** Number of potential secrets found (false positives already excluded via .gitleaksignore) */
  leaks: number;
  /** Number of commits scanned */
  commits: number;
  measuredAt: string;
  notes?: string;
};

/** HTTP security header rating from Mozilla Observatory */
export type SecurityHeaders = {
  /** "A+" | "A" | "A-" | "B+" | "B" | ... | "F" | null (not scanned or failed) */
  grade: string | null;
  /** 0..135 (Observatory score; above 100 is A+) */
  score: number | null;
  /** Number of tests passed (out of `total`; Observatory v2 runs 12 tests) */
  passed?: number;
  total?: number;
  /** ISO date */
  measuredAt: string;
  notes?: string;
};

/** Quality checks for native/CLI apps (a Lighthouse substitute).
 *  For apps without a web page, shows only objectively verifiable items as pass/warn/fail. */
export type NativeCheckStatus = "pass" | "warn" | "fail";

export type NativeCheck = {
  label: string;
  status: NativeCheckStatus;
  detail?: string;
};

export type NativeQuality = {
  checks: NativeCheck[];
  /** ISO date */
  measuredAt: string;
  notes?: string;
};

/** Node kind in the system architecture diagram. Used for colors and the legend */
export type ArchNodeKind = "client" | "edge" | "server" | "external" | "storage" | "build";

/** One node (box) in the architecture diagram */
export type ArchNode = {
  label: string;
  sublabel?: string;
  kind: ArchNodeKind;
};

/** One layer of the architecture diagram. Nodes in a layer sit side by side; layers connect top to bottom with arrows */
export type ArchLayer = {
  nodes: ArchNode[];
  /** Label for the connection to the next (lower) layer (protocol, data, etc.). Ignored on the bottom layer */
  connector?: string;
};

/** System architecture diagram. Draws layers from top to bottom */
export type Architecture = {
  layers: ArchLayer[];
};

export type RawProject = {
  id: string;
  name: string;
  description: string;
  trackedPackages: string[];
  /** Declares the main technologies directly (for tech not on npm, e.g. Swift).
   *  When set, it takes precedence over npm version tracking via trackedPackages. */
  staticTech?: TechVersion[];
  category: Exclude<Category, "All">;
  platform: Platform;
  services: string[];
  createdAt: string;
  updatedAt: string;
  githubUrl: string;
  githubVisibility: GithubVisibility;
  liveUrl?: string;
  /** Explicit eyecatch image for the card. When unset, the OGP of liveUrl is fetched.
   *  Useful even with a liveUrl (sites that return 429 for bot protection, apps without a web page). */
  ogImage?: string;
  favicon?: string;
  emoji: string;
  lighthouseScores?: LighthouseScores;
  /** Quality metrics for native/CLI apps without a web page (a Lighthouse substitute). */
  nativeQuality?: NativeQuality;
  testCoverage?: TestCoverage;
  securityScores?: SecurityScores;
  secretScan?: SecretScan;
  securityHeaders?: SecurityHeaders;
  /** Client work or personal project. Unset is treated as "personal".
   *  "client" entries are excluded from the summary stats and the table and shown only in their own section. */
  kind?: "personal" | "client";
  /** Order among the featured picks. Only entries with it appear in the hero section (consecutive, starting at 1) */
  featuredRank?: number;
  /** One-line highlight for the featured card (80 characters max). Only for works with featuredRank */
  highlight?: string;
  /** Technical summary (2-4 sentences) */
  technicalOverview?: string;
  /** System architecture diagram */
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
