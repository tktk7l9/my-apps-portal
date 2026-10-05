import { describe, expect, it } from "vitest";
import { computeSecurityScore } from "@/lib/security-score";
import { rawProjects } from "@/lib/projects";

describe("computeSecurityScore", () => {
  it("returns 100 with no advisories", () => {
    expect(computeSecurityScore({ critical: 0, high: 0, moderate: 0, low: 0 })).toBe(100);
  });

  it("weights each severity", () => {
    expect(computeSecurityScore({ critical: 1, high: 1, moderate: 1, low: 1 })).toBe(61);
  });

  it("never goes below 0", () => {
    expect(computeSecurityScore({ critical: 5, high: 0, moderate: 0, low: 0 })).toBe(0);
  });

  it("matches the stored score of every project", () => {
    for (const project of rawProjects) {
      if (!project.securityScores) continue;
      expect(project.securityScores.score, project.id).toBe(
        computeSecurityScore(project.securityScores)
      );
    }
  });
});
