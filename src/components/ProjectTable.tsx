"use client";

import Image from "next/image";
import { useState, useMemo, useCallback } from "react";
import {
  categories,
  serviceUrls,
  type Category,
  type GithubVisibility,
  type LighthouseScores,
  type Platform,
  type Project,
  type TestCoverage,
} from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { getActionableIssues, buildClaudePrompt } from "@/lib/claude-prompt";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";

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

type SortKey = "name" | "category" | "createdAt" | "updatedAt";
type SortDir = "asc" | "desc";

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [techFilterOpen, setTechFilterOpen] = useState(false);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);

  const actionableApps = useMemo(() => {
    return projects
      .map((p) => {
        const issues = getActionableIssues(p, versionStatuses, latestVersions);
        return { project: p, issues };
      })
      .filter(({ issues }) => issues.length > 0);
  }, [projects, versionStatuses, latestVersions]);

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
      setSortDir("asc");
    }
  };

  const toggleTech = (tech: string) => {
    setActiveTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        const matchCat  = activeCategory === "All" || p.category === activeCategory;
        const matchTech = activeTechs.length === 0 || p.techVersions.some((t) => activeTechs.includes(t.name));
        const matchQ    =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.techVersions.some((t) => t.name.toLowerCase().includes(q)) ||
          p.services.some((s) => s.toLowerCase().includes(q));
        return matchCat && matchTech && matchQ;
      })
      .sort((a, b) => {
        const av = sortKey === "updatedAt" ? (lastCommitDates[a.id] ?? a.updatedAt) : (a[sortKey] as string);
        const bv = sortKey === "updatedAt" ? (lastCommitDates[b.id] ?? b.updatedAt) : (b[sortKey] as string);
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [projects, activeCategory, activeTechs, query, sortKey, sortDir, lastCommitDates]);

  return (
    <div className="space-y-3">
      {/* Search (mobile: full width) + Category */}
      <div className="space-y-2 sm:space-y-0">
        <input
          type="search"
          placeholder="検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 sm:hidden"
        />
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {cat}
              <span className={`text-[10px] tabular-nums ${activeCategory === cat ? "text-white" : "text-slate-400"}`}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
          <input
            type="search"
            placeholder="検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ml-auto hidden w-44 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 sm:block"
          />
        </div>
      </div>

      {/* Tech filter: モバイルは toggle 式、sm以上は常時表示 */}
      <div>
        <button
          onClick={() => setTechFilterOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center gap-2 text-xs text-slate-400 sm:hidden"
          aria-expanded={techFilterOpen}
        >
          <span>Tech フィルタ</span>
          {activeTechs.length > 0 && (
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
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
          className={`mt-2 flex-wrap items-center gap-1.5 sm:mt-0 sm:flex ${techFilterOpen ? "flex" : "hidden"}`}
        >
          <span className="mr-0.5 hidden text-xs text-slate-400 sm:inline">Tech</span>
          {allTechs.map((tech) => (
            <button
              key={tech}
              onClick={() => toggleTech(tech)}
              className={`inline-flex rounded-md px-2 py-0.5 text-xs transition-colors ${
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
              onClick={() => setActiveTechs([])}
              className="ml-1 text-xs text-slate-400 hover:text-slate-200"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Version summary */}
      {(versionSummary.vulnerable > 0 || versionSummary.outdated > 0) && (
        <div className="flex items-center gap-4 text-xs">
          {versionSummary.vulnerable > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              脆弱性 {versionSummary.vulnerable} 件
            </span>
          )}
          {versionSummary.outdated > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              アップデートあり {versionSummary.outdated} 件
            </span>
          )}
        </div>
      )}

      {/* Desktop table (lg+) - 11列あるので tablet 以下ではカード表示にフォールバック */}
      <div className="hidden overflow-x-auto rounded-xl border border-white/8 lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3 text-left text-xs text-slate-300">
              <Th>アプリ</Th>
              <SortTh label="カテゴリ" col="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th>主要技術・バージョン</Th>
              <Th>Lighthouse</Th>
              <Th>Vitest</Th>
              <Th>Security</Th>
              <SortTh label="作成日 / 更新日" col="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th>使用サービス</Th>
              <Th>GitHub</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-600">
                  該当するプロジェクトがありません
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
                  onSelect={setSelectedProject}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (lg未満) */}
      <div className="grid gap-3 lg:hidden">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-slate-600">該当するプロジェクトがありません</p>
        ) : (
          filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              versionStatuses={versionStatuses}
              lastCommitDates={lastCommitDates}
              onSelect={setSelectedProject}
            />
          ))
        )}
      </div>

      {/* 依頼文言 */}
      {actionableApps.length > 0 && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-indigo-300">依頼文言</p>
            <button
              onClick={() => {
                const all = actionableApps
                  .map(({ project, issues }) => buildClaudePrompt(project, issues))
                  .join("\n\n");
                handleCopy("__all__", all);
              }}
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors ${
                copiedKey === "__all__"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/8 text-slate-400 hover:bg-white/15 hover:text-slate-200"
              }`}
            >
              {copiedKey === "__all__" ? "コピー済み" : "まとめてコピー"}
            </button>
          </div>
          <div className="space-y-2">
            {actionableApps.map(({ project, issues }) => {
              const prompt = buildClaudePrompt(project, issues);
              const isCopied = copiedKey === project.id;
              return (
                <div key={project.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 mb-1.5">{project.name}</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed select-all">{prompt}</pre>
                  </div>
                  <button
                    onClick={() => handleCopy(project.id, prompt)}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors ${
                      isCopied
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/8 text-slate-400 hover:bg-white/15 hover:text-slate-200"
                    }`}
                  >
                    {isCopied ? "コピー済み" : "コピー"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
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
    <th className="px-4 py-3 font-medium">
      <button
        onClick={() => onSort(col)}
        className="flex items-center gap-1 transition-colors hover:text-slate-300"
      >
        {label}
        <span className={active ? "text-indigo-400" : "text-slate-700"}>
          {active && sortDir === "asc" ? "↑" : active && sortDir === "desc" ? "↓" : "↕"}
        </span>
      </button>
    </th>
  );
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
          <span key={t.name} className="inline-flex items-center gap-1.5 text-xs">
            <a
              href={t.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-slate-300 hover:text-white hover:underline underline-offset-2"
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
  onSelect: (p: Project) => void;
}) {
  const vis = visibilityConfig[project.githubVisibility];
  const displayUpdatedAt = lastCommitDates[project.id] ?? project.updatedAt;

  return (
    <tr className={`transition-colors hover:bg-white/3 ${isLast ? "" : "border-b border-white/5"}`}>
      <td className="px-4 py-3">
        <p className="flex items-center gap-1.5 font-medium text-white">
          <ProjectIcon project={project} />
          <button
            onClick={() => onSelect(project)}
            className="underline-offset-2 hover:text-indigo-300 hover:underline transition-colors text-left"
          >
            {project.name}
          </button>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} — ライブサイトを開く`}
              className="inline-flex h-6 w-6 flex-none items-center justify-center text-slate-500 transition-colors hover:text-indigo-400"
            >
              <ExternalIcon />
            </a>
          )}
        </p>
        <p className="mt-0.5 max-w-[200px] text-xs leading-relaxed text-slate-400">
          {project.description}
        </p>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${categoryColors[project.category]}`}>
            {project.category}
          </span>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${platformConfig[project.platform].className}`}>
            {platformConfig[project.platform].label}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <TechVersions project={project} versionStatuses={versionStatuses} />
        </div>
      </td>

      <td className="px-4 py-3">
        {project.lighthouseScores ? (
          <LighthouseCell scores={project.lighthouseScores} />
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        {project.testCoverage ? (
          <VitestCell coverage={project.testCoverage} />
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        <SecurityGroupCell project={project} />
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5 text-xs tabular-nums whitespace-nowrap">
          <span className="text-slate-400">{project.createdAt}</span>
          <span className="text-slate-400">{displayUpdatedAt}</span>
        </div>
      </td>

      <td className="px-4 py-3">
        {project.services.length === 0 ? (
          <span className="text-slate-700">—</span>
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

      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <a
            href={project.githubVisibility !== "local-only" ? project.githubUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs ${
              project.githubVisibility !== "local-only"
                ? "text-slate-400 hover:text-white"
                : "cursor-default text-slate-700"
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

function ProjectCard({
  project,
  versionStatuses,
  lastCommitDates,
  onSelect,
}: {
  project: Project;
  versionStatuses: Record<string, VersionStatus>;
  lastCommitDates: Record<string, string>;
  onSelect: (p: Project) => void;
}) {
  const vis = visibilityConfig[project.githubVisibility];
  const displayUpdatedAt = lastCommitDates[project.id] ?? project.updatedAt;

  const hasMetrics =
    project.lighthouseScores ||
    project.testCoverage ||
    project.securityScores ||
    project.secretScan ||
    project.securityHeaders;

  return (
    <div className="space-y-3 rounded-xl border border-white/8 bg-white/2 p-3 sm:p-4">
      {/* Header: icon + name + live link */}
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 font-medium text-white">
          <ProjectIcon project={project} />
          <button
            onClick={() => onSelect(project)}
            className="text-left underline-offset-2 transition-colors hover:text-indigo-300 hover:underline"
          >
            {project.name}
          </button>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} — ライブサイトを開く`}
              className="inline-flex h-6 w-6 flex-none items-center justify-center text-slate-500 transition-colors hover:text-indigo-400"
            >
              <ExternalIcon />
            </a>
          )}
          <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${categoryColors[project.category]}`}>
            {project.category}
          </span>
        </p>
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{project.description}</p>
      </div>

      {/* Compact metrics grid: 2列 (xs) / 3列 (sm+) */}
      {hasMetrics && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {project.lighthouseScores && (
            <MetricBox label="Lighthouse">
              <LighthouseCell scores={project.lighthouseScores} />
            </MetricBox>
          )}
          {project.testCoverage && (
            <MetricBox label="Vitest">
              <VitestCell coverage={project.testCoverage} />
            </MetricBox>
          )}
          {(project.securityScores || project.secretScan || project.securityHeaders) && (
            <MetricBox label="Security">
              <SecurityGroupCell project={project} />
            </MetricBox>
          )}
        </div>
      )}

      {/* Platform/visibility/github pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ${platformConfig[project.platform].className}`}>
          {platformConfig[project.platform].label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] ring-1 ${vis.className}`}>
          {project.githubVisibility === "private" && <LockIcon />}
          {vis.label}
        </span>
        <a
          href={project.githubVisibility !== "local-only" ? project.githubUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto inline-flex items-center gap-1 text-[10px] ${
            project.githubVisibility !== "local-only"
              ? "text-slate-400 hover:text-white"
              : "cursor-default text-slate-700"
          }`}
        >
          <GitHubIcon />
          repo
        </a>
      </div>

      {/* Tech versions */}
      {project.techVersions.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
          <TechVersions project={project} versionStatuses={versionStatuses} />
        </div>
      )}

      {/* Services */}
      {project.services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.services.map((s) => (
            <a
              key={s}
              href={serviceUrls[s]}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium transition-[filter] hover:brightness-125 ${serviceColors[s] ?? "bg-white/5 text-slate-400"}`}
            >
              {s}
            </a>
          ))}
        </div>
      )}

      {/* Dates */}
      <div className="flex gap-3 text-[10px] tabular-nums text-slate-500">
        <span>作成 {project.createdAt}</span>
        <span>更新 {displayUpdatedAt}</span>
      </div>
    </div>
  );
}

function MetricBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white/3 px-2.5 py-1.5 ring-1 ring-white/5">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </div>
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

function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function lighthouseColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function LighthouseCell({ scores }: { scores: LighthouseScores }) {
  const items: { label: string; value: number }[] = [
    { label: "P",   value: scores.performance },
    { label: "A",   value: scores.accessibility },
    { label: "BP",  value: scores.bestPractices },
    { label: "SEO", value: scores.seo },
  ];
  return (
    <div
      className="inline-flex flex-col gap-0.5"
      title={`Lighthouse 計測日: ${scores.measuredAt}`}
    >
      {items.map(({ label, value }) => (
        <span key={label} className="flex items-baseline justify-between gap-1.5">
          <span className="text-[10px] text-slate-500">{label}</span>
          <span className={`text-xs tabular-nums font-semibold ${lighthouseColor(value)}`}>{value}</span>
        </span>
      ))}
    </div>
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
  title,
}: {
  label: string;
  value: string;
  color: string;
  title: string;
}) {
  return (
    <div className="flex cursor-help items-center justify-between gap-2" title={title}>
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

// Security / Secrets / Headers を1セルに縦並びでまとめる。各行に説明ツールチップ付き。
function SecurityGroupCell({ project }: { project: Project }) {
  const sec = project.securityScores;
  const scan = project.secretScan;
  const hdr = project.securityHeaders;
  if (!sec && !scan && !hdr) return <span className="text-slate-700">—</span>;

  return (
    <div className="flex min-w-[88px] flex-col gap-1.5">
      {sec && (
        <SecurityRow
          label="Security"
          value={String(sec.score)}
          color={securityColor(sec.score)}
          title={
            `Security: 依存パッケージの脆弱性スコア (npm audit ベース・0〜100の減点式)。\n` +
            `Critical ${sec.critical} / High ${sec.high} / Moderate ${sec.moderate} / Low ${sec.low}・依存 ${sec.totalDependencies}件\n` +
            `計測日 ${sec.measuredAt}${sec.notes ? `\n${sec.notes}` : ""}`
          }
        />
      )}
      {scan && (
        <SecurityRow
          label="Secrets"
          value={String(scan.leaks)}
          color={scan.leaks === 0 ? "text-emerald-400" : "text-red-400"}
          title={
            `Secrets: git 履歴のシークレット (APIキー等) 漏洩スキャン (gitleaks ベース)。\n` +
            `漏洩 ${scan.leaks} 件・${scan.commits} commits 走査\n` +
            `計測日 ${scan.measuredAt}${scan.notes ? `\n${scan.notes}` : ""}`
          }
        />
      )}
      {hdr && (
        <SecurityRow
          label="Headers"
          value={hdr.grade ?? "—"}
          color={gradeColor(hdr.grade)}
          title={
            `Headers: HTTP セキュリティヘッダーの評価 (Mozilla Observatory ベース)。\n` +
            (hdr.grade
              ? `グレード ${hdr.grade}${hdr.score !== null ? `・スコア ${hdr.score}` : ""}${
                  hdr.passed !== undefined ? `・${hdr.passed}/${hdr.total} passed` : ""
                }`
              : "スキャン失敗") +
            `\n計測日 ${hdr.measuredAt}${hdr.notes ? `\n${hdr.notes}` : ""}`
          }
        />
      )}
    </div>
  );
}

function gradeColor(grade: string | null): string {
  if (!grade) return "text-slate-500";
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-lime-400";
  if (grade.startsWith("C")) return "text-amber-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
}

function VitestCell({ coverage }: { coverage: TestCoverage }) {
  const items: { label: string; value: number }[] = [
    { label: "S",   value: coverage.statements },
    { label: "Br",  value: coverage.branches },
    { label: "F",   value: coverage.functions },
    { label: "L",   value: coverage.lines },
  ];
  const title = `Vitest カバレッジ (${coverage.tests} tests, ${coverage.measuredAt} 計測)${coverage.notes ? `\n${coverage.notes}` : ""}`;
  return (
    <div className="inline-flex flex-col gap-0.5" title={title}>
      {items.map(({ label, value }) => (
        <span key={label} className="flex items-baseline justify-between gap-1.5">
          <span className="text-[10px] text-slate-500">{label}</span>
          <span className={`text-xs tabular-nums font-semibold ${coverageColor(value)}`}>
            {Math.round(value)}
          </span>
        </span>
      ))}
      <span className="mt-0.5 text-[10px] text-slate-500 tabular-nums text-right">
        ({coverage.tests} tests)
      </span>
    </div>
  );
}
