"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { eyecatchSrc } from "@/lib/eyecatch";
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
        {projects.map((project, index) => (
          <FeaturedCard
            key={project.id}
            project={project}
            index={index}
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
  index,
  onSelect,
}: {
  project: Project;
  index: number;
  onSelect: () => void;
}) {
  const [ogpFailed, setOgpFailed] = useState(false);
  const src = eyecatchSrc(project);
  const showOgp = src !== null && !ogpFailed;
  // 最初の2枚（above the fold）だけ即時読み込みし、残りは遅延読み込みする
  const imageLoading = index < 2 ? "eager" : "lazy";

  return (
    <article className="relative overflow-hidden rounded-xl border border-white/8 bg-white/3 transition-colors hover:border-white/15">
      <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#0b1018]">
        {showOgp ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src!}
            alt={`${project.name} のプレビュー`}
            className="h-full w-full object-cover"
            loading={imageLoading}
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
          {/* ::after のオーバーレイでカード全体をクリック可能にする（stretched button）。
              article 側の position:relative が ::after (position:absolute, inset:0) の
              基準になる。ボタン自体はテキストサイズのままで、見出しの外に出した
              highlight / tech chips / FeaturedMetrics を button で覆わないため、
              それらはスクリーンリーダーの見出しアウトラインや本文として正しく読み上げられる */}
          <button
            type="button"
            onClick={onSelect}
            className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </button>
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
