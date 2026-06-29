import type { Project } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";

export type ActionableIssue = {
  techName: string;
  currentVersion: string;
  latestVersion: string | null;
  status: VersionStatus;
};

export function getActionableIssues(
  project: Project,
  versionStatuses: Record<string, VersionStatus>,
  latestVersions: Record<string, string>,
): ActionableIssue[] {
  const result: ActionableIssue[] = [];
  for (const t of project.techVersions) {
    const key = `${t.name}@${t.version}`;
    const status = versionStatuses[key];
    if (status !== "outdated" && status !== "vulnerable") continue;
    result.push({
      techName: t.name,
      currentVersion: t.version,
      latestVersion: latestVersions[key] ?? null,
      status,
    });
  }
  return result;
}

export function buildClaudePrompt(
  project: Project,
  issues: ActionableIssue[],
): string {
  const dir = `~/src/github.com/tktk7l9/${project.id}`;
  if (issues.length === 1) {
    const { techName, currentVersion, latestVersion, status } = issues[0];
    const vuln = status === "vulnerable" ? "（脆弱性あり）" : "";
    const to = latestVersion ?? "最新版";
    return `${dir} の ${techName} を ${currentVersion} から ${to} にアップデートして。完了したらcommitとpushして。${vuln}`;
  }
  const lines = issues.map(
    ({ techName, currentVersion, latestVersion, status }) => {
      const to = latestVersion ?? "最新版";
      const vuln = status === "vulnerable" ? "（脆弱性あり）" : "";
      return `・${techName}: ${currentVersion} → ${to}${vuln}`;
    },
  );
  return `${dir} の以下をアップデートして。完了したらcommitとpushして。\n${lines.join("\n")}`;
}
