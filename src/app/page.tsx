import { PortfolioHeader } from "@/components/PortfolioHeader";
import { StatsSummary } from "@/components/StatsSummary";
import { ProjectTable } from "@/components/ProjectTable";
import { RefreshButton } from "@/components/RefreshButton";
import { FeaturedWorks } from "@/components/FeaturedWorks";
import { rawProjects } from "@/lib/projects";
import { computePortfolioStats } from "@/lib/stats";
import { enrichProjectsWithVersions } from "@/lib/repo-versions";
import { getVersionStatuses } from "@/lib/version-status";
import { getLastCommitDates } from "@/lib/github";
import { selectFeatured, selectRest } from "@/lib/featured";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <PortfolioHeader />
        <StatsSummary stats={computePortfolioStats(rawProjects)} />

        <main>
          <ProjectDataLoader />
        </main>

        <footer className="mt-16 border-t border-white/5 pt-8 text-center text-xs text-slate-400">
          <a
            href="https://github.com/tktk7l9"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            github.com/tktk7l9
          </a>
        </footer>
      </div>
    </div>
  );
}

async function ProjectDataLoader() {
  const projects = await enrichProjectsWithVersions(rawProjects);

  const allEntries = projects.flatMap((p) =>
    p.techVersions.map((t) => ({ techName: t.name, version: t.version }))
  );
  const publicRepos = projects
    .filter((p) => p.githubVisibility === "public")
    .map((p) => ({ id: p.id, githubUrl: p.githubUrl }));

  const [{ statuses: versionStatuses, latestVersions }, lastCommitDates] = await Promise.all([
    getVersionStatuses(allEntries),
    getLastCommitDates(publicRepos),
  ]);

  const featured = selectFeatured(projects);
  const rest = selectRest(projects);

  return (
    <>
      <FeaturedWorks
        projects={featured}
        versionStatuses={versionStatuses}
        latestVersions={latestVersions}
        lastCommitDates={lastCommitDates}
      />

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            他の作品
          </h2>
          <span className="text-sm text-slate-500 tabular-nums">{rest.length} 件</span>
          <div className="ml-auto">
            <RefreshButton />
          </div>
        </div>
        <ProjectTable
          projects={rest}
          versionStatuses={versionStatuses}
          latestVersions={latestVersions}
          lastCommitDates={lastCommitDates}
        />
      </section>
    </>
  );
}
