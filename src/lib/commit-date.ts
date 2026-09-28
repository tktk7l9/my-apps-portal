/**
 * Picks the "last meaningful change" date from a GitHub commit list (SHIG 28, 42).
 *
 * Workspace-wide dependency sweeps and chores touch every repository on the same day,
 * so the raw last-commit date makes every row show the same date and the
 * "updated" sort carries no information. Maintenance commits are skipped here.
 */

export type CommitLike = {
  commit: { message: string; committer: { date: string } | null };
  author: { login: string } | null;
};

/** Conventional-commit types that do not change what the app does */
const MAINTENANCE_PREFIX = /^(chore|build|ci|docs|style|test)(\([^)]*\))?!?:/i;
const MERGE_PREFIX = /^Merge (pull request|branch|remote-tracking branch)\b/;

export function isMaintenanceCommit(commit: CommitLike): boolean {
  const login = commit.author?.login ?? "";
  if (login.endsWith("[bot]")) return true;
  const message = commit.commit.message.trimStart();
  return MAINTENANCE_PREFIX.test(message) || MERGE_PREFIX.test(message);
}

/** Returns the YYYY-MM-DD date of the newest non-maintenance commit, or null */
export function pickMeaningfulCommitDate(commits: CommitLike[]): string | null {
  const meaningful = commits.find((c) => !isMaintenanceCommit(c));
  const date = meaningful?.commit.committer?.date?.slice(0, 10);
  return date ? date : null;
}
