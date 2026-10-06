import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eyecatchSrc } from "@/lib/eyecatch";
import { packageMeta, rawProjects, serviceUrls } from "@/lib/projects";

describe("eyecatch sources", () => {
  // A Worker cannot fetch another workers.dev host of the same account (Cloudflare error 1042),
  // so /api/ogp answers 502 in production for those apps even though it works in local dev.
  // Their eyecatch must be a static copy under public/og or a generated /api/og card.
  it("no workers.dev app resolves its eyecatch through the /api/ogp proxy", () => {
    for (const project of rawProjects) {
      if (!project.liveUrl || !new URL(project.liveUrl).host.endsWith(".workers.dev")) continue;
      const src = eyecatchSrc(project);
      expect(src, `${project.id} has no eyecatch`).not.toBeNull();
      expect(src!.startsWith("/api/ogp"), `${project.id} resolves through /api/ogp: ${src}`).toBe(false);
      expect(src!.startsWith("/"), `${project.id} loads its eyecatch cross-origin: ${src}`).toBe(true);
    }
  });

  it("every static eyecatch under /og exists in public/og", () => {
    for (const project of rawProjects) {
      if (!project.ogImage?.startsWith("/og/")) continue;
      const file = join(process.cwd(), "public", project.ogImage);
      expect(existsSync(file), `${project.id}: ${project.ogImage} is missing`).toBe(true);
    }
  });
});

describe("catalog and lookup table consistency", () => {
  it("every trackedPackage is registered in packageMeta", () => {
    for (const project of rawProjects) {
      for (const name of project.trackedPackages) {
        expect(packageMeta[name], `${project.id} の ${name} が packageMeta に無い`).toBeDefined();
      }
    }
  });

  it("every service is registered in serviceUrls", () => {
    for (const project of rawProjects) {
      for (const name of project.services) {
        expect(serviceUrls[name], `${project.id} の ${name} が serviceUrls に無い`).toBeDefined();
      }
    }
  });
});

// Mozilla Observatory v2 grade bands (lower bound of each grade).
const observatoryBands: ReadonlyArray<readonly [number, string]> = [
  [100, "A+"], [90, "A"], [85, "A-"], [80, "B+"], [70, "B"], [65, "B-"],
  [60, "C+"], [50, "C"], [45, "C-"], [40, "D+"], [30, "D"], [25, "D-"], [0, "F"],
];

function expectedGrade(score: number): string {
  return observatoryBands.find(([min]) => score >= min)![1];
}

// Dates in the catalog are written in the owner's local time (JST), not UTC.
function todayInTokyo(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}

describe("measured values are internally consistent", () => {
  it("Lighthouse scores are integers in 0..100 with a valid, non-future date", () => {
    const today = todayInTokyo();
    for (const project of rawProjects) {
      const lh = project.lighthouseScores;
      if (!lh) continue;
      for (const key of ["performance", "accessibility", "bestPractices", "seo"] as const) {
        const value = lh[key];
        expect(Number.isInteger(value) && value >= 0 && value <= 100, `${project.id} ${key}=${value}`).toBe(true);
      }
      expect(isIsoDate(lh.measuredAt), `${project.id} measuredAt=${lh.measuredAt}`).toBe(true);
      expect(lh.measuredAt <= today, `${project.id} measuredAt is in the future`).toBe(true);
    }
  });

  it("Observatory grade matches its score band and passed never exceeds total", () => {
    const today = todayInTokyo();
    for (const project of rawProjects) {
      const sh = project.securityHeaders;
      if (!sh) continue;
      expect(isIsoDate(sh.measuredAt), `${project.id} measuredAt=${sh.measuredAt}`).toBe(true);
      expect(sh.measuredAt <= today, `${project.id} measuredAt is in the future`).toBe(true);
      if (sh.score !== null) {
        expect(sh.grade, `${project.id} score=${sh.score}`).toBe(expectedGrade(sh.score));
      }
      if (sh.passed !== undefined || sh.total !== undefined) {
        expect(sh.passed, `${project.id} passed`).toBeDefined();
        expect(sh.total, `${project.id} total`).toBeDefined();
        expect(sh.passed! <= sh.total!, `${project.id} ${sh.passed}/${sh.total}`).toBe(true);
      }
    }
  });
});
