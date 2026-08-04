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
