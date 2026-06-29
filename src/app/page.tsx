import { ProjectTable } from "@/components/ProjectTable";
import { RefreshButton } from "@/components/RefreshButton";
import { rawProjects } from "@/lib/projects";
import { enrichProjectsWithVersions } from "@/lib/repo-versions";
import { getVersionStatuses } from "@/lib/version-status";
import { getLastCommitDates } from "@/lib/github";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-5 sm:mb-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">My Apps</h1>
            <p className="text-xs sm:text-sm text-slate-400">個人で作成したWebアプリの一覧です。</p>
            <div className="ml-auto">
              <RefreshButton />
            </div>
          </div>
        </header>

        <main>
          <ProjectDataLoader />
        </main>

        <footer className="mt-16 border-t border-white/5 pt-8 text-center text-xs text-slate-400">
          <a
            href="https://github.com/tktk7l9"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-400"
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

  return (
    <ProjectTable
      projects={projects}
      versionStatuses={versionStatuses}
      latestVersions={latestVersions}
      lastCommitDates={lastCommitDates}
    />
  );
}
