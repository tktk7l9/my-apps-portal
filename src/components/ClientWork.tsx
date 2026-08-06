import type { Project } from "@/lib/projects";
import { eyecatchSrc } from "@/lib/eyecatch";

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
        {projects.map((project) => {
          const eyecatch = eyecatchSrc(project);

          return (
            <article
              key={project.id}
              className="overflow-hidden rounded-xl border border-white/8 bg-white/3"
            >
              {/* sm 以上では画像を左に回す。全幅で敷くと代表作カード（2列で約560px）より
                  大きくなり、実務案件が代表作より目立つ逆転が起きるため */}
              <div className="flex flex-col sm:flex-row">
                {eyecatch && (
                  <div className="relative aspect-[1200/630] w-full shrink-0 overflow-hidden bg-[#0b1018] sm:w-[38%] sm:self-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={eyecatch}
                      alt={`${project.name} のプレビュー`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="min-w-0 p-4 sm:p-5">
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
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
