import type { TechVersion } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";

/** Minimal shape with techVersions. Not requiring a full Project reduces coupling for callers */
type HasTechVersions = { techVersions: TechVersion[] };

/** Lookup unit passed to getVersionStatuses */
export type VersionCheckEntry = {
  techName: string;
  version: string;
  versionIsRange?: boolean;
};

/**
 * Collects the techName@version entries to look up in the npm registry / OSV.
 *
 * Projects that declare `staticTech` intend to bypass npm tracking, so they are excluded.
 * staticTech versions hold majors only (React "19") or values outside npm's versioning
 * (macOS "arm64"), so comparing them against the npm registry as-is would misreport
 * "update available" for exactly those whose displayName happens to match an npm package
 * name (React / TypeScript). Electron and CodeMirror are harmless only because
 * they are not registered in packageMeta and fall through to unknown.
 */
export function collectVersionCheckEntries(
  projects: (HasTechVersions & { staticTech?: unknown })[]
): VersionCheckEntry[] {
  return projects
    .filter((project) => !project.staticTech)
    .flatMap((project) =>
      project.techVersions.map((tech) => ({
        techName: tech.name,
        version: tech.version,
        versionIsRange: tech.versionIsRange,
      }))
    );
}

/**
 * Narrows versionStatuses (for all projects) to the `techName@version` keys
 * actually used by the given projects.
 *
 * ProjectTable shows the Object.values() count of the versionStatuses it receives as
 * "アップデートあり N 件", so passing the full map, including projects not in the table
 * (featured picks, client work), makes the count disagree with the rows shown.
 * Callers narrow it to the projects in the table before passing it.
 */
export function filterVersionStatusesForProjects(
  versionStatuses: Record<string, VersionStatus>,
  projects: HasTechVersions[]
): Record<string, VersionStatus> {
  const keys = new Set<string>();
  for (const project of projects) {
    for (const tech of project.techVersions) {
      keys.add(`${tech.name}@${tech.version}`);
    }
  }

  return Object.fromEntries(
    Object.entries(versionStatuses).filter(([key]) => keys.has(key))
  );
}
