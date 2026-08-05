import type { Project } from "@/lib/projects";

export function ClientWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-16">
      <h2 className="mb-1 text-lg font-bold text-white sm:text-xl">
        実務プロジェクト
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        守秘のため、技術構成と担当範囲のみ掲載しています。
      </p>
      <div className="grid gap-4">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl border border-white/8 bg-white/3 p-4 sm:p-5"
          >
            <div className="flex items-baseline gap-2">
              <span aria-hidden="true" className="text-lg">{project.emoji}</span>
              <h3 className="text-base font-bold text-white sm:text-lg">
                {project.name}
              </h3>
              <span className="rounded bg-slate-500/15 px-2 py-0.5 text-xs text-slate-400 ring-1 ring-slate-500/25">
                非公開
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {project.description}
            </p>

            {project.technicalOverview && (
              <p className="mt-3 border-l-2 border-white/10 pl-3 text-xs leading-relaxed text-slate-500">
                {project.technicalOverview}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.techVersions.map((tech) => (
                <span
                  key={tech.name}
                  className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300"
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
