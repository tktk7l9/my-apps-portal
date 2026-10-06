import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPkg from "react/package.json" with { type: "json" };

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // vitest coverage output (generated)
    "coverage/**",
    // OpenNext / wrangler build output (generated)
    ".open-next/**",
    ".wrangler/**",
  ]),
  {
    // eslint-plugin-react's `version: "detect"` calls context.getFilename(),
    // which ESLint 10 removed. Pin the version from the installed package.
    settings: { react: { version: reactPkg.version } },
  },
  {
    // Blog pages are prerendered and served as Workers static assets, which answer by path
    // only. A next/link would prefetch the RSC payload (`?_rsc=`) and get the HTML back,
    // so plain <a> full-page navigation is the intended behaviour there.
    files: ["src/app/blog/**", "src/components/blog/**", "src/components/PortfolioHeader.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
]);

export default eslintConfig;
