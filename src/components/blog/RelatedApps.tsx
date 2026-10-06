import Image from "next/image";
import type { RawProject } from "@/lib/projects";
import { WorkLinks } from "@/components/WorkLinks";

/**
 * Apps an article is about. "ポートフォリオで見る" deep-links to the detail modal on the
 * home page (`/?work=<id>`, the same URL the portal itself uses), beside the live site
 * and GitHub links from WorkLinks.
 */
export function RelatedApps({ projects }: { projects: RawProject[] }) {
  if (projects.length === 0) return null;

  return (
    <section aria-labelledby="related-apps-heading" className="mt-12">
      <h2 id="related-apps-heading" className="mb-3 text-lg font-bold text-white">
        この記事のアプリ
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              {project.favicon ? (
                <Image src={project.favicon} alt="" width={18} height={18} className="shrink-0 rounded-sm object-contain" unoptimized />
              ) : (
                <span aria-hidden="true" className="text-base leading-none">
                  {project.emoji}
                </span>
              )}
              {project.name}
            </h3>
            {project.highlight && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{project.highlight}</p>}
            <div className="mt-3">
              <a
                href={`/?work=${project.id}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-white/8 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-white/15 sm:min-h-9"
              >
                ポートフォリオで詳細を見る
              </a>
            </div>
            <WorkLinks project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}
