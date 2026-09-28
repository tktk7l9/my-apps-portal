import type { Project } from "@/lib/projects";
import { ExternalIcon, GitHubIcon } from "@/components/icons";

/**
 * "Open the site" / GitHub actions for a card (SHIG 20, 22, 30).
 * Placed above a stretched-button overlay (`relative z-10`) so the card can still
 * open the detail modal while these links go straight to the work.
 * Targets are at least 44px tall on touch widths (SHIG 78, 93).
 */
export function WorkLinks({ project }: { project: Project }) {
  const showGitHub = project.githubVisibility === "public";
  if (!project.liveUrl && !showGitHub) return null;

  return (
    <div className="relative z-10 mt-3 flex flex-wrap gap-2">
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.name} のサイトを開く（新しいタブ）`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-indigo-500/15 px-3 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/25 sm:min-h-9"
        >
          <ExternalIcon />
          サイトを開く
        </a>
      )}
      {showGitHub && (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.name} の GitHub リポジトリ（新しいタブ）`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-white/8 px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/15 sm:min-h-9"
        >
          <GitHubIcon />
          GitHub
        </a>
      )}
    </div>
  );
}
