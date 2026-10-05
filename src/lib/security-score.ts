import type { SecurityScores } from "@/lib/projects";

/** score = max(0, 100 - 25*critical - 10*high - 3*moderate - 1*low), from production-dependency counts. */
export function computeSecurityScore(
  counts: Pick<SecurityScores, "critical" | "high" | "moderate" | "low">
): number {
  return Math.max(
    0,
    100 - 25 * counts.critical - 10 * counts.high - 3 * counts.moderate - counts.low
  );
}
