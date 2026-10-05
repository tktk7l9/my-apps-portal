import { pickMeaningfulCommitDate, type CommitLike } from "@/lib/commit-date";
import { fulfilledEntries } from "@/lib/settled";

/**
 * Returns the date of the last meaningful change per repository.
 * Dependency bumps, chores and merges are skipped (see commit-date.ts); a repository
 * with only maintenance commits in the window is omitted so callers fall back to
 * the curated `updatedAt` in the project data.
 */
export async function getLastCommitDates(
  repos: { id: string; githubUrl: string }[]
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    repos.map(async ({ id, githubUrl }): Promise<[string, string]> => {
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("invalid url");
      const [, owner, repo] = match;
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) throw new Error(`${repo}: ${res.status}`);
      const date = pickMeaningfulCommitDate((await res.json()) as CommitLike[]);
      if (!date) throw new Error(`${repo}: no meaningful commit`);
      return [id, date];
    })
  );
  return fulfilledEntries(results);
}
