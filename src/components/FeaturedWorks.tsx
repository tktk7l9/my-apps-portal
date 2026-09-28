"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";
import { eyecatchSrc } from "@/lib/eyecatch";
import { summaryMetrics } from "@/lib/project-list";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { WorkLinks } from "@/components/WorkLinks";
import { useWorkSelection } from "@/components/useWorkSelection";

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
  const { selected, open, close } = useWorkSelection(projects);

  if (projects.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-16">
      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">ピックアップ</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project, index) => (
          <FeaturedCard
            key={project.id}
            project={project}
            index={index}
            onSelect={() => open(project)}
          />
        ))}
      </div>

      {selected && (
        <ProjectDetailModal
          project={selected}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
          onClose={close}
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
  // Load only the first two (above the fold) eagerly and lazy-load the rest
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
          {/* An ::after overlay makes the whole card clickable (stretched button).
              The article's position:relative is the containing block for ::after (position:absolute, inset:0).
              The button itself stays text-sized and does not wrap highlight / tech chips /
              FeaturedMetrics, which sit outside the heading, so screen readers read them
              correctly as part of the heading structure and body text */}
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
        <WorkLinks project={project} />
      </div>
    </article>
  );
}

function FeaturedMetrics({ project }: { project: Project }) {
  const metrics = summaryMetrics(project);
  if (metrics.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
      {metrics.map((metric) => (
        <li key={metric} className="tabular-nums">
          {metric}
        </li>
      ))}
    </ul>
  );
}
