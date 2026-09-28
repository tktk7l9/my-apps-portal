import { describe, expect, it } from "vitest";
import { isMaintenanceCommit, pickMeaningfulCommitDate, type CommitLike } from "@/lib/commit-date";

function commit(message: string, date: string, login: string | null = "tktk7l9"): CommitLike {
  return {
    commit: { message, committer: { date } },
    author: login === null ? null : { login },
  };
}

describe("isMaintenanceCommit", () => {
  it.each([
    "chore(deps): upgrade eslint 9 -> 10 (#38)",
    "build(deps-dev): bump the npm-minor-patch group with 4 updates (#34)",
    "chore: translate source comments to English (#39)",
    "ci: pin actions",
    "docs: update README",
    "style: format",
    "test: add cases",
    "Merge pull request #33 from tktk7l9/add-sumai-log",
    "Merge branch 'main' into feature",
  ])("treats %s as maintenance", (message) => {
    expect(isMaintenanceCommit(commit(message, "2026-09-28T00:00:00Z"))).toBe(true);
  });

  it("treats bot authors as maintenance", () => {
    expect(isMaintenanceCommit(commit("Bump next", "2026-09-28T00:00:00Z", "dependabot[bot]"))).toBe(true);
  });

  it.each([
    "feat: add sumai-log",
    "fix(modal): keep focus",
    "perf: lazy-load images",
    "refactor: split table",
    "ポートフォリオに作品を追加",
  ])("treats %s as a meaningful change", (message) => {
    expect(isMaintenanceCommit(commit(message, "2026-09-28T00:00:00Z", null))).toBe(false);
  });
});

describe("pickMeaningfulCommitDate", () => {
  it("skips maintenance commits and returns the newest meaningful date", () => {
    const commits = [
      commit("chore(deps): bump", "2026-09-28T10:00:00Z"),
      commit("Merge pull request #1 from x/y", "2026-09-27T10:00:00Z"),
      commit("feat: new screen", "2026-09-20T10:00:00Z"),
      commit("fix: typo", "2026-09-10T10:00:00Z"),
    ];
    expect(pickMeaningfulCommitDate(commits)).toBe("2026-09-20");
  });

  it("returns null when every commit is maintenance", () => {
    expect(pickMeaningfulCommitDate([commit("chore: x", "2026-09-28T00:00:00Z")])).toBeNull();
    expect(pickMeaningfulCommitDate([])).toBeNull();
  });

  it("returns null when the meaningful commit has no date", () => {
    expect(pickMeaningfulCommitDate([commit("feat: x", "")])).toBeNull();
  });
});
