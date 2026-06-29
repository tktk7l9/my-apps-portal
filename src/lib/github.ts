type CommitResponse = { commit: { committer: { date: string } } }[];

export async function getLastCommitDates(
  repos: { id: string; githubUrl: string }[]
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    repos.map(async ({ id, githubUrl }): Promise<[string, string]> => {
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("invalid url");
      const [, owner, repo] = match;
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) throw new Error(`${repo}: ${res.status}`);
      const data = (await res.json()) as CommitResponse;
      const date = data[0]?.commit?.committer?.date?.slice(0, 10);
      if (!date) throw new Error(`${repo}: no date`);
      return [id, date];
    })
  );
  return Object.fromEntries(
    results
      .filter(
        (r): r is PromiseFulfilledResult<[string, string]> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value)
  );
}
