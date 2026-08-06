"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import Image from "next/image";
import { serviceUrls, type Architecture, type ArchNodeKind, type GithubVisibility, type LighthouseScores, type NativeQuality, type Project, type SecretScan, type SecurityHeaders, type SecurityScores, type TestCoverage } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { eyecatchSrc } from "@/lib/eyecatch";
import { Paragraphs } from "@/components/Paragraphs";

const versionColors: Record<VersionStatus, string> = {
  latest:     "text-emerald-500",
  outdated:   "text-amber-500",
  vulnerable: "text-red-500",
  unknown:    "text-slate-600",
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

/** ダイアログ内のフォーカス可能要素を判定するセレクタ。
 *  非表示 (offsetParent === null) は getFocusableElements 側で追加除外する。 */
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

  // フォーカストラップ: 開いたらモーダル内へフォーカス移動し、Tab/Shift+Tab を
  // モーダル内で循環させ、閉じたら開く前のフォーカスへ戻す。
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const focusable = getFocusableElements(dialog);
    (focusable[0] ?? dialog)?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const current = getFocusableElements(dialog);
      if (current.length === 0) {
        // フォーカス可能要素が無い場合はダイアログ自体に留める（例外・無限ループ防止）
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
  const vis = visibilityConfig[project.githubVisibility];

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
        // max-w-3xl(768px) は本文が1行50字。日本語の快適域(35〜50字)の上限で、
        // これ以上広げると長文の可読性が落ちる（4xl=59字・5xl=69字と実測）
        className="relative flex max-h-[calc(100dvh_-_1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl sm:max-h-[calc(100dvh_-_3rem)] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-4 top-4 text-slate-600 transition-colors hover:text-slate-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* OGP image */}
        {eyecatchSrc(project) && !ogpError && (
          <div className="relative aspect-[1.91/1] w-full shrink-0 overflow-hidden rounded-t-2xl bg-white/5">
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

        <div className="min-h-0 grow overflow-y-auto overscroll-contain p-4 sm:p-6">
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/25"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Live
              </a>
            )}
            <a
              href={project.githubVisibility !== "local-only" ? project.githubUrl : undefined}
              target={project.githubVisibility !== "local-only" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                project.githubVisibility !== "local-only"
                  ? "bg-white/8 text-slate-300 hover:bg-white/15"
                  : "cursor-default bg-white/5 text-slate-600"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ring-1 ${vis.className}`}>
                {vis.label}
              </span>
            </a>
          </div>

          {/* Technical overview */}
          {project.technicalOverview && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">技術的概要</p>
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
                <p className="mb-3 text-xs font-medium text-slate-500">システム構成図</p>
                <ArchitectureDiagram architecture={project.architecture} />
              </div>
            </>
          )}

          {/* Divider */}
          <div className="my-5 border-t border-white/5" />

          {/* Tech stack */}
          <div>
            <p className="mb-3 text-xs font-medium text-slate-500">技術スタック</p>
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
                      <span className="text-slate-600">—</span>
                    )}
                    {(status === "outdated" || status === "vulnerable") && latest && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
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
                <p className="mb-3 text-xs font-medium text-slate-500">使用サービス</p>
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
                <p className="mb-3 text-xs font-medium text-slate-500">
                  Lighthouse スコア
                  <span className="ml-2 text-slate-700">({project.lighthouseScores.measuredAt} 計測)</span>
                </p>
                <LighthouseScoresDetail scores={project.lighthouseScores} />
              </div>
            </>
          )}

          {/* Native quality (Lighthouse 非該当のネイティブアプリ向け) */}
          {!project.lighthouseScores && project.nativeQuality && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">
                  Native 品質チェック
                  <span className="ml-2 text-slate-700">({project.nativeQuality.measuredAt} 計測)</span>
                </p>
                <NativeQualityDetail quality={project.nativeQuality} />
                {project.nativeQuality.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{project.nativeQuality.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Test coverage */}
          {project.testCoverage && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">
                  Vitest カバレッジ
                  <span className="ml-2 text-slate-700">
                    ({project.testCoverage.tests} tests, {project.testCoverage.measuredAt} 計測)
                  </span>
                </p>
                <TestCoverageDetail coverage={project.testCoverage} />
                {project.testCoverage.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{project.testCoverage.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Security */}
          {project.securityScores && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">
                  セキュリティスコア
                  <span className="ml-2 text-slate-700">
                    ({project.securityScores.tool === "none" ? "依存なし" : `${project.securityScores.tool} audit`},
                    {" "}{project.securityScores.totalDependencies} deps, {project.securityScores.measuredAt} 計測)
                  </span>
                </p>
                <SecurityScoresDetail scores={project.securityScores} />
                {project.securityScores.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{project.securityScores.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Secret scan */}
          {project.secretScan && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">
                  Secret スキャン
                  <span className="ml-2 text-slate-700">
                    (gitleaks, {project.secretScan.commits} commits, {project.secretScan.measuredAt} 計測)
                  </span>
                </p>
                <SecretScanDetail scan={project.secretScan} />
                {project.secretScan.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{project.secretScan.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Security headers */}
          {project.securityHeaders && (
            <>
              <div className="my-5 border-t border-white/5" />
              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">
                  HTTP セキュリティヘッダー
                  <span className="ml-2 text-slate-700">
                    (Mozilla Observatory, {project.securityHeaders.measuredAt} 計測)
                  </span>
                </p>
                <SecurityHeadersDetail headers={project.securityHeaders} />
                {project.securityHeaders.notes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{project.securityHeaders.notes}</p>
                )}
              </div>
            </>
          )}

          {/* Dates */}
          <div className="mt-5 flex gap-4 text-xs tabular-nums text-slate-600">
            <span>作成 {project.createdAt}</span>
            <span>更新 {displayUpdatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function lighthouseColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function lighthouseBg(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function NativeQualityDetail({ quality }: { quality: NativeQuality }) {
  const mark = { pass: "✓", warn: "⚠", fail: "✕" } as const;
  const color = {
    pass: "text-emerald-400",
    warn: "text-amber-400",
    fail: "text-red-400",
  } as const;
  return (
    <div className="space-y-2">
      {quality.checks.map((c) => (
        <div key={c.label} className="flex items-start gap-2 text-xs sm:text-sm">
          <span className={`shrink-0 font-semibold ${color[c.status]}`}>{mark[c.status]}</span>
          <span className="w-28 shrink-0 text-slate-300 sm:w-36">{c.label}</span>
          {c.detail && <span className="text-slate-500">{c.detail}</span>}
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
    <div className="space-y-2.5">
      {items.map(({ label, key }) => {
        const score = scores[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">{label}</span>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${lighthouseBg(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`w-8 shrink-0 text-right text-sm tabular-nums font-semibold ${lighthouseColor(score)}`}>
                {score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function securityColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function securityBg(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
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
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">Score</span>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${securityBg(scores.score)}`}
              style={{ width: `${scores.score}%` }}
            />
          </div>
          <span className={`w-8 shrink-0 text-right text-sm tabular-nums font-semibold ${securityColor(scores.score)}`}>
            {scores.score}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-md bg-white/3 px-2 py-1.5 text-center ring-1 ring-white/5"
          >
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className={`text-sm tabular-nums font-semibold ${value > 0 ? color : "text-slate-600"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecretScanDetail({ scan }: { scan: SecretScan }) {
  const color = scan.leaks === 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">検出件数</span>
      <span className={`text-2xl tabular-nums font-bold ${color}`}>{scan.leaks}</span>
      <span className="text-xs text-slate-500">
        {scan.leaks === 0 ? "✓ git履歴含めて漏洩なし" : "要対応"}
      </span>
    </div>
  );
}

function headerGradeColor(grade: string | null): string {
  if (!grade) return "text-slate-500";
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-lime-400";
  if (grade.startsWith("C")) return "text-amber-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
}

function SecurityHeadersDetail({ headers }: { headers: SecurityHeaders }) {
  if (!headers.grade) {
    return <p className="text-sm text-slate-500">スキャンに失敗しました (詳細は notes 参照)</p>;
  }
  const pct = headers.score !== null ? Math.min(100, headers.score) : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">グレード</span>
        <span className={`text-3xl tabular-nums font-bold ${headerGradeColor(headers.grade)}`}>
          {headers.grade}
        </span>
        {headers.score !== null && (
          <span className="text-sm text-slate-500 tabular-nums">{headers.score}/100</span>
        )}
      </div>
      {headers.passed !== undefined && headers.total !== undefined && (
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">合格テスト</span>
          <div className="flex flex-1 items-center gap-2">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                style={{ width: `${(headers.passed / headers.total) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-sm tabular-nums font-semibold text-slate-300">
              {headers.passed} / {headers.total}
            </span>
          </div>
        </div>
      )}
      {headers.score !== null && headers.score < 100 && (
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">スコア</span>
          <div className="flex flex-1 items-center gap-2">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-lime-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function coverageColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function coverageBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function TestCoverageDetail({ coverage }: { coverage: TestCoverage }) {
  const items: { label: string; key: keyof Omit<TestCoverage, "tests" | "measuredAt" | "notes"> }[] = [
    { label: "Statements", key: "statements" },
    { label: "Branches",   key: "branches" },
    { label: "Functions",  key: "functions" },
    { label: "Lines",      key: "lines" },
  ];
  return (
    <div className="space-y-2.5">
      {items.map(({ label, key }) => {
        const score = coverage[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-slate-300 sm:w-32 sm:text-sm">{label}</span>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${coverageBg(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`w-12 shrink-0 text-right text-sm tabular-nums font-semibold ${coverageColor(score)}`}>
                {score.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
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
                    <span className="mt-0.5 text-[10px] leading-tight text-slate-500">{node.sublabel}</span>
                  )}
                </div>
              ))}
            </div>
            {i < architecture.layers.length - 1 && (
              <div className="flex flex-col items-center py-1.5">
                {layer.connector && (
                  <span className="mb-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] leading-none text-slate-500">
                    {layer.connector}
                  </span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600" aria-hidden="true">
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
          <span key={kind} className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className={`h-2 w-2 rounded-full ${archDotStyles[kind]}`} />
            {archKindLabels[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}
