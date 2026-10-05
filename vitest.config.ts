import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/stats.ts",
        "src/lib/version-status.ts",
        "src/lib/featured.ts",
        "src/lib/version-filter.ts",
        "src/lib/eyecatch.ts",
        "src/lib/paragraphs.ts",
        "src/lib/work-param.ts",
        "src/lib/work-history.ts",
        "src/lib/commit-date.ts",
        "src/lib/version-spec.ts",
        "src/lib/project-list.ts",
        "src/lib/ogp.ts",
        "src/lib/settled.ts",
        "src/lib/security-score.ts",
        "src/lib/security-headers.ts",
        "src/lib/fetched-at.ts",
      ],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
