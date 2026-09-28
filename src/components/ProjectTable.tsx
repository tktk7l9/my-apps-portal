"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import {
  categories,
  serviceUrls,
  type Category,
  type GithubVisibility,
  type LighthouseScores,
  type NativeQuality,
  type Platform,
  type Project,
  type TestCoverage,
} from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import {
  filterProjects,
  hasActiveConditions,
  nativeSummary,
  sortProjects,
  summaryMetrics,
  type ListConditions,
  type SortDir,
  type SortKey,
} from "@/lib/project-list";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { WorkLinks } from "@/components/WorkLinks";
import { ExternalIcon, GitHubIcon, LockIcon } from "@/components/icons";
import { useWorkSelection } from "@/components/useWorkSelection";

const versionColors: Record<VersionStatus, string> = {
  latest:     "text-emerald-500 hover:text-emerald-400",
  outdated:   "text-amber-500  hover:text-amber-400",
  vulnerable: "text-red-500    hover:text-red-400",
  unknown:    "text-slate-400  hover:text-slate-200",
};

const categoryColors: Record<string, string> = {
  Game:      "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  Simulator: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  Tool:      "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  Other:     "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

const platformConfig: Record<Platform, { label: string; className: string }> = {
  web: {
    label: "Web",
    className: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  },
  "chrome-extension": {
    label: "Chrome拡張",
    className: "bg-purple-500/15 text-purple-400 ring-purple-500/30",
  },
  other: {
    label: "Other",
    className: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
  },
};

const serviceColors: Record<string, string> = {
  Vercel:              "bg-slate-700/60 text-slate-300",
  Supabase:            "bg-green-900/40 text-green-400",
  "Anthropic Claude":  "bg-orange-900/40 text-orange-400",
  "Google Gemini":     "bg-blue-900/40 text-blue-400",
  Resend:              "bg-purple-900/40 text-purple-400",
  "GitHub Pages":      "bg-gray-700/60 text-gray-300",
};

const visibilityConfig: Record<GithubVisibility, { label: string; className: string }> = {
  public:       { label: "Public",     className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25" },
  private:      { label: "Private",    className: "bg-slate-500/15 text-slate-400 ring-slate-500/25" },
  "local-only": { label: "Local only", className: "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20" },
};

/** Sort choices for touch widths, where there are no sortable column headers (SHIG 36, 6) */
const mobileSortOptions: { value: `${SortKey}:${SortDir}`; label: string }[] = [
  { value: "updatedAt:desc", label: "更新日が新しい順" },
  { value: "updatedAt:asc",  label: "更新日が古い順" },
  { value: "createdAt:desc", label: "作成日が新しい順" },
  { value: "createdAt:asc",  label: "作成日が古い順" },
  { value: "name:asc",       label: "名前順" },
  { value: "category:asc",   label: "カテゴリ順" },
];

const DEFAULT_CONDITIONS: ListConditions = { category: "All", techs: [], query: "" };

export function ProjectTable({
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
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeTechs, setActiveTechs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [techFilterOpen, setTechFilterOpen] = useState(false);
  const { selected: selectedProject, open: openProject, close: closeProject } = useWorkSelection(projects);

  const allTechs = useMemo(
    () => [...new Set(projects.flatMap((p) => p.techVersions.map((t) => t.name)))].sort(),
    [projects]
  );

  const versionSummary = useMemo(() => ({
    vulnerable: Object.values(versionStatuses).filter((s) => s === "vulnerable").length,
    outdated:   Object.values(versionStatuses).filter((s) => s === "outdated").length,
  }), [versionStatuses]);

  const categoryCounts = useMemo<Record<Category, number>>(() => {
    const counts = { All: projects.length } as Record<Category, number>;
    for (const cat of categories.slice(1)) {
      counts[cat] = projects.filter((p) => p.category === cat).length;
    }
    return counts;
  }, [projects]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Dates read newest-first by default; text columns A→Z
      setSortDir(key === "createdAt" || key === "updatedAt" ? "desc" : "asc");
    }
  };

  const toggleTech = (tech: string) => {
    setActiveTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const conditions: ListConditions = { category: activeCategory, techs: activeTechs, query };

  const resetConditions = () => {
    setActiveCategory(DEFAULT_CONDITIONS.category);
    setActiveTechs(DEFAULT_CONDITIONS.techs);
    setQuery(DEFAULT_CONDITIONS.query);
  };

  const filtered = useMemo(
    () =>
      sortProjects(
        filterProjects(projects, { category: activeCategory, techs: activeTechs, query }),
        sortKey,
        sortDir,
        lastCommitDates
      ),
    [projects, activeCategory, activeTechs, query, sortKey, sortDir, lastCommitDates]
  );

  const searchClass =
    "rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-200 placeholder-muted outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60";

  return (
    <div className="space-y-3">
      {/* Search (mobile: full width) + Category */}
      <div className="space-y-2 sm:space-y-0">
        <input
          type="search"
          placeholder="検索..."
          aria-label="作品を検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${searchClass} min-h-11 w-full sm:hidden`}
        />
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors sm:min-h-8 ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {cat}
              <span className={`text-xs tabular-nums ${activeCategory === cat ? "text-white" : "text-slate-400"}`}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
          <input
            type="search"
            placeholder="検索..."
            aria-label="作品を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${searchClass} ml-auto hidden min-h-8 w-44 sm:block`}
          />
        </div>
      </div>

      {/* Tech filter: a toggle on mobile, always shown from sm up */}
      <div>
        <button
          type="button"
          onClick={() => setTechFilterOpen((v) => !v)}
          className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md bg-white/3 px-3 text-xs text-slate-300 sm:hidden"
          aria-expanded={techFilterOpen}
        >
          <span>Tech フィルタ</span>
          {activeTechs.length > 0 && (
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">
              {activeTechs.length} 選択中
            </span>
          )}
          <svg
            className={`ml-auto h-3 w-3 transition-transform ${techFilterOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div
          className={`mt-2 flex-wrap items-center gap-2 sm:mt-0 sm:flex sm:gap-1.5 ${techFilterOpen ? "flex" : "hidden"}`}
        >
          <span className="mr-0.5 hidden text-xs text-slate-400 sm:inline">Tech</span>
          {allTechs.map((tech) => (
            <button
              key={tech}
              type="button"
              aria-pressed={activeTechs.includes(tech)}
              onClick={() => toggleTech(tech)}
              className={`inline-flex min-h-9 items-center rounded-md px-2.5 text-xs transition-colors sm:min-h-7 sm:px-2 ${
                activeTechs.includes(tech)
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tech}
            </button>
          ))}
          {activeTechs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTechs([])}
              className="ml-1 inline-flex min-h-9 items-center px-2 text-xs text-slate-400 hover:text-slate-200 sm:min-h-7"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Version summary + mobile sort */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {versionSummary.vulnerable > 0 && (
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
            脆弱性 {versionSummary.vulnerable} 件
          </span>
        )}
        {versionSummary.outdated > 0 && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            アップデートあり {versionSummary.outdated} 件
          </span>
        )}
        <label className="ml-auto flex items-center gap-2 text-slate-400 lg:hidden">
          並び順
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":") as [SortKey, SortDir];
              setSortKey(key);
              setSortDir(dir);
            }}
            className="min-h-11 rounded-md border border-white/10 bg-[#0b1018] px-2 text-sm text-slate-200"
          >
            {mobileSortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Legend for the abbreviated table headers; details live in the detail modal (SHIG 11, 31) */}
      <p className="hidden text-xs leading-relaxed text-slate-400 lg:block">
        Lighthouse は P=Performance・A=Accessibility・BP=Best Practices・SEO、
        Vitest はカバレッジ S=Statements・Br=Branches・F=Functions・L=Lines（%）。
        Security は依存パッケージの脆弱性スコア、Secrets は git 履歴の秘密情報の検出件数、Headers は HTTP セキュリティヘッダーの評価です。
        計測日や内訳は作品名から詳細を開くと表示されます。
      </p>

      {/* Desktop table (lg+) - many columns, so tablet and below fall back to cards */}
      <div className="hidden overflow-x-auto rounded-xl border border-white/8 lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3 text-left text-xs text-slate-300">
              <SortTh label="アプリ" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="カテゴリ" col="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th>主要技術・バージョン</Th>
              <Th>Lighthouse / Native</Th>
              <Th>Vitest</Th>
              <Th>Security</Th>
              <DateSortTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th>使用サービス</Th>
              <Th>リンク</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState conditions={conditions} onReset={resetConditions} />
                </td>
              </tr>
            ) : (
              filtered.map((project, i) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isLast={i === filtered.length - 1}
                  versionStatuses={versionStatuses}
                  lastCommitDates={lastCommitDates}
                  onSelect={openProject}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (below lg) */}
      <div className="grid gap-3 lg:hidden">
        {filtered.length === 0 ? (
          <EmptyState conditions={conditions} onReset={resetConditions} />
        ) : (
          filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={openProject} />
          ))
        )}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
          onClose={closeProject}
        />
      )}
    </div>
  );
}

/** Empty result with the active conditions and a single way out (SHIG 55, 60) */
function EmptyState({
  conditions,
  onReset,
}: {
  conditions: ListConditions;
  onReset: () => void;
}) {
  const parts: string[] = [];
  if (conditions.category !== "All") parts.push(`カテゴリ「${conditions.category}」`);
  if (conditions.techs.length > 0) parts.push(`技術「${conditions.techs.join("・")}」`);
  if (conditions.query.trim()) parts.push(`検索「${conditions.query.trim()}」`);

  return (
    <div className="px-4 py-12 text-center" role="status">
      <p className="text-sm text-slate-300">該当するプロジェクトがありません</p>
      {parts.length > 0 && (
        <p className="mt-1 text-xs text-slate-400">{parts.join("、")} で絞り込んでいます</p>
      )}
      {hasActiveConditions(conditions) && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:min-h-9"
        >
          条件をすべて解除
        </button>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-medium">{children}</th>;
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span aria-hidden="true" className={active ? "text-indigo-400" : "text-muted"}>
      {active && dir === "asc" ? "↑" : active && dir === "desc" ? "↓" : "↕"}
    </span>
  );
}

/** One column shows both dates, each sortable on its own (SHIG 36) */
function DateSortTh({
  sortKey, sortDir, onSort,
}: {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === "createdAt" || sortKey === "updatedAt";
  return (
    <th
      className="px-3 py-3 font-medium"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className="flex flex-col items-start">
        {(["createdAt", "updatedAt"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSort(key)}
            className="flex min-h-7 items-center gap-1 whitespace-nowrap transition-colors hover:text-white"
          >
            {key === "createdAt" ? "作成日" : "更新日"}
            <SortArrow active={sortKey === key} dir={sortDir} />
          </button>
        ))}
      </div>
    </th>
  );
}

function SortTh({
  label, col, sortKey, sortDir, onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      className="px-3 py-3 font-medium"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className="flex min-h-7 items-center gap-1 transition-colors hover:text-white"
      >
        {label}
        <SortArrow active={active} dir={sortDir} />
      </button>
    </th>
  );
}

/** Version status in words, so it does not rely on the version's color alone (SHIG 96, 70) */
function VersionStatusBadge({ status }: { status: VersionStatus }) {
  if (status === "vulnerable") {
    return (
      <span className="rounded bg-red-500/10 px-1 text-xs text-red-400 ring-1 ring-red-500/25">脆弱性</span>
    );
  }
  if (status === "outdated") {
    return (
      <span className="rounded bg-amber-500/10 px-1 text-xs text-amber-400 ring-1 ring-amber-500/25">更新あり</span>
    );
  }
  return null;
}

function TechVersions({
  project,
  versionStatuses,
}: {
  project: Project;
  versionStatuses: Record<string, VersionStatus>;
}) {
  return (
    <>
      {project.techVersions.map((t) => {
        const status = versionStatuses[`${t.name}@${t.version}`] ?? "unknown";
        const verColor = versionColors[status];
        return (
          <span key={t.name} className="flex flex-wrap items-center gap-x-1.5 text-xs">
            <a
              href={t.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap py-1 text-slate-300 hover:text-white hover:underline underline-offset-2"
            >
              {t.name}
            </a>
            {t.version !== "—" && (
              t.versionUrl ? (
                <a
                  href={t.versionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-1 tabular-nums underline-offset-2 hover:underline ${verColor}`}
                >
                  {t.version}
                </a>
              ) : (
                <span className={`tabular-nums ${verColor}`}>{t.version}</span>
              )
            )}
            <VersionStatusBadge status={status} />
          </span>
        );
      })}
    </>
  );
}

function ProjectRow({
  project,
  isLast,
  versionStatuses,
  lastCommitDates,
  onSelect,
}: {
  project: Project;
  isLast: boolean;
  versionStatuses: Record<string, VersionStatus>;
  lastCommitDates: Record<string, string>;
  onSelect: (p: Project, event?: { detail: number }) => void;
}) {
  const vis = visibilityConfig[project.githubVisibility];
  const displayUpdatedAt = lastCommitDates[project.id] ?? project.updatedAt;
  const hasRepo = project.githubVisibility !== "local-only";

  return (
    <tr className={`transition-colors hover:bg-white/3 ${isLast ? "" : "border-b border-white/5"}`}>
      <td className="px-3 py-3">
        <p className="flex items-center gap-1.5 font-medium text-white">
          <ProjectIcon project={project} />
          <button
            type="button"
            onClick={(e) => onSelect(project, e)}
            className="underline-offset-2 hover:text-indigo-300 hover:underline transition-colors text-left"
          >
            {project.name}
          </button>
        </p>
        <p className="mt-0.5 line-clamp-2 max-w-[200px] text-xs leading-relaxed text-slate-400">
          {project.description}
        </p>
      </td>

      <td className="px-3 py-3">
        <div className="flex flex-col items-start gap-1">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${categoryColors[project.category]}`}>
            {project.category}
          </span>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${platformConfig[project.platform].className}`}>
            {platformConfig[project.platform].label}
          </span>
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <TechVersions project={project} versionStatuses={versionStatuses} />
        </div>
      </td>

      <td className="px-3 py-3">
        {project.lighthouseScores ? (
          <LighthouseCell scores={project.lighthouseScores} />
        ) : project.nativeQuality ? (
          <NativeQualityCell quality={project.nativeQuality} />
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>

      <td className="px-3 py-3">
        {project.testCoverage ? (
          <VitestCell coverage={project.testCoverage} />
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>

      <td className="px-3 py-3">
        <SecurityGroupCell project={project} />
      </td>

      <td className="px-3 py-3">
        <div className="flex flex-col gap-0.5 text-xs tabular-nums whitespace-nowrap text-slate-400">
          <span>{project.createdAt}</span>
          <span>{displayUpdatedAt}</span>
        </div>
      </td>

      <td className="px-3 py-3">
        {project.services.length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <div className="flex flex-col gap-1">
            {project.services.map((s) => (
              <a
                key={s}
                href={serviceUrls[s]}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium transition-[filter] hover:brightness-125 ${serviceColors[s] ?? "bg-white/5 text-slate-400"}`}
              >
                {s}
              </a>
            ))}
          </div>
        )}
      </td>

      {/* The site link lives in its own column, away from the name button that opens
          the detail modal: two very different outcomes should not sit side by side (SHIG 16) */}
      <td className="px-3 py-3">
        <div className="flex flex-col items-start gap-1.5">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} のサイトを開く（新しいタブ）`}
              className="inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-md bg-indigo-500/15 px-2 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25"
            >
              <ExternalIcon />
              サイト
            </a>
          )}
          <a
            href={hasRepo ? project.githubUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-7 items-center gap-1 text-xs ${
              hasRepo ? "text-slate-400 hover:text-white" : "cursor-default text-muted"
            }`}
          >
            <GitHubIcon />
            repo
          </a>
          <span className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs ring-1 ${vis.className}`}>
            {project.githubVisibility === "private" && <LockIcon />}
            {vis.label}
          </span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Compact card for touch widths (SHIG 67, 82, 20): identity, a short description,
 * one line of headline metrics and the site link. The full breakdown (all scores,
 * versions, services, dates) is one tap away in the detail modal.
 */
function ProjectCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (p: Project, event?: { detail: number }) => void;
}) {
  const metrics = summaryMetrics(project);

  return (
    <article className="relative rounded-xl border border-white/8 bg-white/2 p-4 transition-colors hover:border-white/15">
      <div className="flex items-start gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 font-medium text-white">
          <ProjectIcon project={project} />
          {/* Stretched button: the whole card opens the detail modal (links below sit above it with z-10) */}
          <button
            type="button"
            onClick={(e) => onSelect(project, e)}
            className="text-left after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </button>
        </h3>
        <span className={`ml-auto inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryColors[project.category]}`}>
          {project.category}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{project.description}</p>
      {metrics.length > 0 && (
        <p className="mt-2 text-xs tabular-nums text-slate-400">{metrics.join("・")}</p>
      )}
      <WorkLinks project={project} />
    </article>
  );
}

function ProjectIcon({ project }: { project: Project }) {
  if (project.favicon) {
    return (
      <Image
        src={project.favicon}
        alt=""
        width={16}
        height={16}
        className="shrink-0 rounded-sm object-contain"
        unoptimized
      />
    );
  }
  return (
    <span className="shrink-0 text-sm leading-none" aria-hidden="true">
      {project.emoji}
    </span>
  );
}

function lighthouseColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function NativeQualityCell({ quality }: { quality: NativeQuality }) {
  return (
    <div className="inline-flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">Native</span>
      <span className="text-xs font-semibold text-slate-200">{nativeSummary(quality.checks)}</span>
    </div>
  );
}

function LighthouseCell({ scores }: { scores: LighthouseScores }) {
  const items: { label: string; full: string; value: number }[] = [
    { label: "P",   full: "Performance",    value: scores.performance },
    { label: "A",   full: "Accessibility",  value: scores.accessibility },
    { label: "BP",  full: "Best Practices", value: scores.bestPractices },
    { label: "SEO", full: "SEO",            value: scores.seo },
  ];
  return (
    <dl className="inline-flex flex-col gap-0.5">
      {items.map(({ label, full, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-1.5">
          <dt className="text-xs text-slate-400"><abbr title={full} className="no-underline">{label}</abbr></dt>
          <dd className={`text-xs tabular-nums font-semibold ${lighthouseColor(value)}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function coverageColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function securityColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function SecurityRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`text-xs font-bold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

// Stacks Security / Secrets / Headers vertically in one cell. The meaning of each
// row is in the legend above the table; the breakdown and dates are in the modal.
function SecurityGroupCell({ project }: { project: Project }) {
  const sec = project.securityScores;
  const scan = project.secretScan;
  const hdr = project.securityHeaders;
  if (!sec && !scan && !hdr) return <span className="text-muted">—</span>;

  return (
    <dl className="flex min-w-[88px] flex-col gap-1.5">
      {sec && <SecurityRow label="Security" value={String(sec.score)} color={securityColor(sec.score)} />}
      {scan && (
        <SecurityRow
          label="Secrets"
          value={String(scan.leaks)}
          color={scan.leaks === 0 ? "text-emerald-400" : "text-red-400"}
        />
      )}
      {hdr && <SecurityRow label="Headers" value={hdr.grade ?? "—"} color={gradeColor(hdr.grade)} />}
    </dl>
  );
}

function gradeColor(grade: string | null): string {
  if (!grade) return "text-slate-400";
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-lime-400";
  if (grade.startsWith("C")) return "text-amber-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
}

function VitestCell({ coverage }: { coverage: TestCoverage }) {
  const items: { label: string; full: string; value: number }[] = [
    { label: "S",   full: "Statements", value: coverage.statements },
    { label: "Br",  full: "Branches",   value: coverage.branches },
    { label: "F",   full: "Functions",  value: coverage.functions },
    { label: "L",   full: "Lines",      value: coverage.lines },
  ];
  return (
    <div className="inline-flex flex-col gap-0.5">
      <dl className="contents">
        {items.map(({ label, full, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-1.5">
            <dt className="text-xs text-slate-400"><abbr title={full} className="no-underline">{label}</abbr></dt>
            <dd className={`text-xs tabular-nums font-semibold ${coverageColor(value)}`}>
              {Math.round(value)}
            </dd>
          </div>
        ))}
      </dl>
      <span className="mt-0.5 whitespace-nowrap text-right text-xs tabular-nums text-slate-400">
        {coverage.tests} テスト
      </span>
    </div>
  );
}
