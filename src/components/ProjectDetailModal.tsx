"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import Image from "next/image";
import { serviceUrls, type Architecture, type ArchNodeKind, type GithubVisibility, type LighthouseScores, type NativeQuality, type Project, type SecretScan, type SecurityHeaders, type SecurityScores, type TestCoverage } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { eyecatchSrc } from "@/lib/eyecatch";
import { nativeCheckLabel } from "@/lib/project-list";
import { Paragraphs } from "@/components/Paragraphs";
import { ExternalIcon, GitHubIcon } from "@/components/icons";

const versionColors: Record<VersionStatus, string> = {
  latest:     "text-emerald-500",
  outdated:   "text-amber-500",
  vulnerable: "text-red-500",
  unknown:    "text-slate-400",
};

const categoryColors: Record<string, string> = {
  Game:      "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  Simulator: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  Tool:      "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  Other:     "bg-slate-500/15 text-slate-400 ring-slate-500/30",
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

/** Selector for focusable elements inside the dialog.
 *  Hidden ones (offsetParent === null) are additionally excluded in getFocusableElements. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
}

export function ProjectDetailModal({
  project,
  versionStatuses,
  latestVersions,
  lastCommitDates,
  onClose,
}: {
  project: Project;
  versionStatuses: Record<string, VersionStatus>;
  latestVersions: Record<string, string>;
  lastCommitDates: Record<string, string>;
  onClose: () => void;
}) {
  const [ogpLoaded, setOgpLoaded] = useState(false);
  const [ogpError, setOgpError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap: on open, move focus into the modal, cycle Tab/Shift+Tab
  // within it, and on close return focus to where it was before opening.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const focusable = getFocusableElements(dialog);
    (focusable[0] ?? dialog)?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const current = getFocusableElements(dialog);
      if (current.length === 0) {
        // With no focusable elements, keep focus on the dialog itself (prevents exceptions / infinite loops)
        e.preventDefault();
        dialog?.focus();
        return;
      }

      const first = current[0];
      const last = current[current.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? current.indexOf(active) : -1;

      if (e.shiftKey) {
        if (activeIndex <= 0) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeIndex === -1 || activeIndex === current.length - 1) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => {
      document.removeEventListener("keydown", handleTab);
      previouslyFocused?.focus();
    };
  }, []);

  const displayUpdatedAt = lastCommitDates[project.id] ?? project.updatedAt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        // max-w-3xl (768px) gives 50 characters per line, the upper end of the comfortable range for Japanese (35-50);
        // any wider hurts readability of long text (measured 4xl = 59 chars, 5xl = 69 chars)
        className="relative flex max-h-[calc(100dvh_-_1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl sm:max-h-[calc(100dvh_-_3rem)] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="閉じる"
          // Body text now scrolls under the button, so give it a background to stay readable
          className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-3.5 sm:right-3 sm:top-3 sm:p-2 text-slate-300 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="min-h-0 grow overflow-y-auto overscroll-contain p-4 sm:p-6">
          {/* OGP image — placed inside the scroll area so it scrolls with the body.
              Outside it would stay pinned at the top, permanently taking about 40% of
              the modal height and squeezing the readable area of the body.
              Negative margins cancel the container padding so only the image is full width */}
          {eyecatchSrc(project) && !ogpError && (
            <div className="relative -mx-4 -mt-4 mb-4 aspect-[1.91/1] overflow-hidden bg-white/5 sm:-mx-6 sm:-mt-6 sm:mb-6">
              {!ogpLoaded && (
                <div className="absolute inset-0 animate-pulse bg-white/5" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={eyecatchSrc(project)!}
                alt={`${project.name} preview`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${ogpLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setOgpLoaded(true)}
                onError={() => setOgpError(true)}
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 shrink-0">
              {project.favicon ? (
                <Image src={project.favicon} alt="" width={24} height={24} className="rounded-sm object-contain" unoptimized />
              ) : (
                <span className="text-2xl leading-none" aria-hidden="true">{project.emoji}</span>
              )}
            </span>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-white">{project.name}</h2>
              <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${categoryColors[project.category]}`}>
                {project.category}
              </span>
            </div>
          </div>

          {/* Description */}
          <Paragraphs
            text={project.description}
            className="mt-4 text-sm leading-relaxed text-slate-400"
          />

          {/* Links */}
          <ModalLinks project={project} />

          {/* Technical overview */}
          {project.technicalOverview && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">技術的概要</p>
                <Paragraphs
                  text={project.technicalOverview}
                  className="text-sm leading-relaxed text-slate-400"
                />
              </div>
            </>
          )}

          {/* System architecture */}
          {project.architecture && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">システム構成図</p>
                <ArchitectureDiagram architecture={project.architecture} />
              </div>
            </>
          )}

          {/* Divider */}
          <div className="my-5 border-t border-white/5" />

          {/* Tech stack */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted">技術スタック</p>
            <div className="space-y-2.5">
              {project.techVersions.map((t) => {
                const key = `${t.name}@${t.version}`;
                const status = versionStatuses[key] ?? "unknown";
                const latest = latestVersions[key];
                return (
                  <div key={t.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <a
                      href={t.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-28 shrink-0 text-slate-300 underline-offset-2 hover:text-white hover:underline sm:w-32"
                    >
                      {t.name}
                    </a>
                    {t.version !== "—" ? (
                      t.versionUrl ? (
                        <a
                          href={t.versionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`tabular-nums underline-offset-2 hover:underline ${versionColors[status]}`}
                        >
                          {t.version}
                        </a>
                      ) : (
                        <span className={`tabular-nums ${versionColors[status]}`}>{t.version}</span>
                      )
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                    {(status === "outdated" || status === "vulnerable") && latest && (
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                        {latest}
                      </span>
                    )}
                    {status === "vulnerable" && (
                      <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400 ring-1 ring-red-500/25">
                        脆弱性あり
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Services */}
          {project.services.length > 0 && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">使用サービス</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.services.map((s) => (
                    <a
                      key={s}
                      href={serviceUrls[s]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium transition-[filter] hover:brightness-125 ${serviceColors[s] ?? "bg-white/5 text-slate-400"}`}
                    >
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Lighthouse scores */}
          {project.lighthouseScores && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  Lighthouse スコア
                  <span className="ml-2 text-muted">({project.lighthouseScores.measuredAt} 計測)</span>
                </p>
                <LighthouseScoresDetail scores={project.lighthouseScores} />
              </div>
            </>
          )}

          {/* Native quality (for native apps where Lighthouse does not apply) */}
          {!project.lighthouseScores && project.nativeQuality && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  Native 品質チェック
                  <span className="ml-2 text-muted">({project.nativeQuality.measuredAt} 計測)</span>
                </p>
                <NativeQualityDetail quality={project.nativeQuality} />
                {project.nativeQuality.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{project.nativeQuality.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Test coverage */}
          {project.testCoverage && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  Vitest カバレッジ
                  <span className="ml-2 text-muted">
                    ({project.testCoverage.tests} tests, {project.testCoverage.measuredAt} 計測)
                  </span>
                </p>
                <TestCoverageDetail coverage={project.testCoverage} />
                {project.testCoverage.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{project.testCoverage.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Security */}
          {project.securityScores && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  セキュリティスコア
                  <span className="ml-2 text-muted">
                    ({project.securityScores.tool === "none" ? "依存なし" : `${project.securityScores.tool} audit`},
                    {" "}{project.securityScores.totalDependencies} deps, {project.securityScores.measuredAt} 計測)
                  </span>
                </p>
                <SecurityScoresDetail scores={project.securityScores} />
                {project.securityScores.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{project.securityScores.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Secret scan */}
          {project.secretScan && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  Secret スキャン
                  <span className="ml-2 text-muted">
                    (gitleaks, {project.secretScan.commits} commits, {project.secretScan.measuredAt} 計測)
                  </span>
                </p>
                <SecretScanDetail scan={project.secretScan} />
                {project.secretScan.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{project.secretScan.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Security headers */}
          {project.securityHeaders && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-muted">
                  HTTP セキュリティヘッダー
                  <span className="ml-2 text-muted">
                    (Mozilla Observatory, {project.securityHeaders.measuredAt} 計測)
                  </span>
                </p>
                <SecurityHeadersDetail headers={project.securityHeaders} />
                {project.securityHeaders.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{project.securityHeaders.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Dates */}
          <div className="mt-5 flex gap-4 text-xs tabular-nums text-muted">
            <span>作成 {project.createdAt}</span>
            <span>更新 {displayUpdatedAt}</span>
          </div>

          {/* Repeat the actions at the end of a long read so the visitor does not
              have to scroll back up to open the work (SHIG 41, 47) */}
          <div className="my-5 border-t border-white/5" />
          <ModalLinks project={project} />
        </div>
      </div>
    </div>
  );
}

function ModalLinks({ project }: { project: Project }) {
  const vis = visibilityConfig[project.githubVisibility];
  const hasRepo = project.githubVisibility !== "local-only";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-indigo-500/15 px-3 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/25 sm:min-h-9"
        >
          <ExternalIcon size={11} />
          Live
        </a>
      )}
      <a
        href={hasRepo ? project.githubUrl : undefined}
        target={hasRepo ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors sm:min-h-9 ${
          hasRepo
            ? "bg-white/8 text-slate-300 hover:bg-white/15"
            : "cursor-default bg-white/5 text-muted"
        }`}
      >
        <GitHubIcon />
        GitHub
        <span className={`rounded-md px-1.5 py-0.5 text-xs ring-1 ${vis.className}`}>
          {vis.label}
        </span>
      </a>
    </div>
  );
}

function lighthouseColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}


function NativeQualityDetail({ quality }: { quality: NativeQuality }) {
  const color = {
    pass: "text-emerald-400",
    warn: "text-amber-400",
    fail: "text-red-400",
  } as const;
  return (
    <div className="space-y-2">
      {quality.checks.map((c) => (
        <div key={c.label} className="flex items-start gap-2 text-xs sm:text-sm">
          <span className={`w-12 shrink-0 font-semibold ${color[c.status]}`}>{nativeCheckLabel[c.status]}</span>
          <span className="w-28 shrink-0 text-slate-300 sm:w-36">{c.label}</span>
          {c.detail && <span className="text-muted">{c.detail}</span>}
        </div>
      ))}
    </div>
  );
}

/** Shared cells that lay out four metrics side by side.
 *
 *  Previously each metric was a row of "label column + full-width bar + value", but
 *  Lighthouse and coverage almost always sit at 98-100, so the bars were
 *  indistinguishable and only took up space (11 bars across 4 sections).
 *  The value itself plus its color (green/yellow/red) reads well enough, so fold them into 4 number-first columns. */
function MetricCells({
  items,
}: {
  items: { label: string; value: string; tone: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(({ label, value, tone }) => (
        <div
          key={label}
          className="rounded-md bg-white/3 px-2 py-1.5 text-center ring-1 ring-white/5"
        >
          <p className="text-xs text-muted">{label}</p>
          <p className={`text-sm tabular-nums font-semibold ${tone}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function LighthouseScoresDetail({ scores }: { scores: LighthouseScores }) {
  const items: { label: string; key: keyof Omit<LighthouseScores, "measuredAt"> }[] = [
    { label: "Performance",    key: "performance" },
    { label: "Accessibility",  key: "accessibility" },
    { label: "Best Practices", key: "bestPractices" },
    { label: "SEO",            key: "seo" },
  ];
  return (
    <MetricCells
      items={items.map(({ label, key }) => ({
        label,
        value: String(scores[key]),
        tone: lighthouseColor(scores[key]),
      }))}
    />
  );
}

function securityColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}


function SecurityScoresDetail({ scores }: { scores: SecurityScores }) {
  const items: { label: string; value: number; color: string }[] = [
    { label: "Critical", value: scores.critical, color: "text-red-500" },
    { label: "High",     value: scores.high,     color: "text-red-400" },
    { label: "Moderate", value: scores.moderate, color: "text-amber-400" },
    { label: "Low",      value: scores.low,      color: "text-slate-400" },
  ];
  return (
    <div className="space-y-3">
      {/* The score is derived from the breakdown below, so a bar would duplicate it */}
      <p className="flex items-baseline gap-2">
        <span className={`text-3xl tabular-nums font-bold ${securityColor(scores.score)}`}>
          {scores.score}
        </span>
        <span className="text-xs text-muted">/ 100</span>
      </p>
      <MetricCells
        items={items.map(({ label, value, color }) => ({
          label,
          value: String(value),
          tone: value > 0 ? color : "text-muted",
        }))}
      />
    </div>
  );
}

function SecretScanDetail({ scan }: { scan: SecretScan }) {
  const color = scan.leaks === 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">検出件数</span>
      <span className={`text-2xl tabular-nums font-bold ${color}`}>{scan.leaks}</span>
      <span className="text-xs text-muted">
        {scan.leaks === 0 ? "合格：git履歴含めて漏洩なし" : "要対応"}
      </span>
    </div>
  );
}

function headerGradeColor(grade: string | null): string {
  if (!grade) return "text-muted";
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-lime-400";
  if (grade.startsWith("C")) return "text-amber-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
}

function SecurityHeadersDetail({ headers }: { headers: SecurityHeaders }) {
  if (!headers.grade) {
    return <p className="text-sm text-muted">スキャンに失敗しました (詳細は notes 参照)</p>;
  }
  // Grade, score and pass count are just three views of the same measurement, so keep them on one line
  // (the score bar duplicated information as soon as the number was shown next to it)
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={`text-3xl tabular-nums font-bold ${headerGradeColor(headers.grade)}`}>
        {headers.grade}
      </span>
      {headers.score !== null && (
        <span className="text-sm tabular-nums text-slate-400">{headers.score} / 100</span>
      )}
      {headers.passed !== undefined && headers.total !== undefined && (
        <span className="text-xs tabular-nums text-muted">
          合格 {headers.passed} / {headers.total}
        </span>
      )}
    </p>
  );
}

function coverageColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}


function TestCoverageDetail({ coverage }: { coverage: TestCoverage }) {
  const items: { label: string; key: keyof Omit<TestCoverage, "tests" | "measuredAt" | "notes"> }[] = [
    { label: "Statements", key: "statements" },
    { label: "Branches",   key: "branches" },
    { label: "Functions",  key: "functions" },
    { label: "Lines",      key: "lines" },
  ];
  return (
    <MetricCells
      items={items.map(({ label, key }) => ({
        label,
        value: `${coverage[key].toFixed(1)}%`,
        tone: coverageColor(coverage[key]),
      }))}
    />
  );
}

const archNodeStyles: Record<ArchNodeKind, string> = {
  client:   "bg-indigo-500/10 text-indigo-300 ring-indigo-500/25",
  edge:     "bg-sky-500/10 text-sky-300 ring-sky-500/25",
  server:   "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
  external: "bg-orange-500/10 text-orange-300 ring-orange-500/25",
  storage:  "bg-teal-500/10 text-teal-300 ring-teal-500/25",
  build:    "bg-slate-500/10 text-slate-400 ring-slate-500/25",
};

const archDotStyles: Record<ArchNodeKind, string> = {
  client:   "bg-indigo-400",
  edge:     "bg-sky-400",
  server:   "bg-emerald-400",
  external: "bg-orange-400",
  storage:  "bg-teal-400",
  build:    "bg-slate-400",
};

const archKindLabels: Record<ArchNodeKind, string> = {
  client:   "クライアント",
  edge:     "ホスティング",
  server:   "サーバー",
  external: "外部API",
  storage:  "データストア",
  build:    "ビルド",
};

function ArchitectureDiagram({ architecture }: { architecture: Architecture }) {
  const usedKinds = [...new Set(architecture.layers.flatMap((l) => l.nodes.map((n) => n.kind)))];
  return (
    <div>
      <div className="flex flex-col">
        {architecture.layers.map((layer, i) => (
          <Fragment key={i}>
            <div className="flex flex-wrap justify-center gap-2">
              {layer.nodes.map((node, j) => (
                <div
                  key={j}
                  className={`flex min-w-[7rem] flex-1 flex-col items-center justify-center rounded-lg px-3 py-2 text-center ring-1 ${archNodeStyles[node.kind]}`}
                >
                  <span className="text-xs font-medium leading-tight sm:text-sm">{node.label}</span>
                  {node.sublabel && (
                    <span className="mt-0.5 text-xs leading-tight text-muted">{node.sublabel}</span>
                  )}
                </div>
              ))}
            </div>
            {i < architecture.layers.length - 1 && (
              <div className="flex flex-col items-center py-1.5">
                {layer.connector && (
                  <span className="mb-1 rounded bg-white/5 px-1.5 py-0.5 text-xs leading-none text-muted">
                    {layer.connector}
                  </span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        {usedKinds.map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${archDotStyles[kind]}`} />
            {archKindLabels[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}
