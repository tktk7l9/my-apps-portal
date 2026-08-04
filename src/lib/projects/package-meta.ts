import type { PackageMeta } from "./types";

export const packageMeta: Record<string, PackageMeta> = {
  next: {
    displayName: "Next.js",
    docsUrl: "https://nextjs.org/docs",
    versionUrl: (v) => `https://github.com/vercel/next.js/releases/tag/v${v}`,
  },
  react: {
    displayName: "React",
    docsUrl: "https://react.dev",
    versionUrl: (v) => `https://github.com/facebook/react/releases/tag/v${v}`,
  },
  three: {
    displayName: "Three.js",
    docsUrl: "https://threejs.org/docs/",
    versionUrl: (v) => {
      const minor = v.split(".")[1];
      return minor ? `https://github.com/mrdoob/three.js/releases/tag/r${minor}` : undefined;
    },
  },
  vite: {
    displayName: "Vite",
    docsUrl: "https://vite.dev/guide/",
    versionUrl: (v) => `https://github.com/vitejs/vite/releases/tag/v${v}`,
  },
  leaflet: {
    displayName: "Leaflet",
    docsUrl: "https://leafletjs.com/reference.html",
    versionUrl: (v) => `https://github.com/Leaflet/Leaflet/releases/tag/v${v}`,
  },
  typescript: {
    displayName: "TypeScript",
    docsUrl: "https://www.typescriptlang.org/docs/",
    versionUrl: (v) => {
      const parts = v.split(".");
      if (parts.length < 2) return undefined;
      return `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-${parts[0]}-${parts[1]}.html`;
    },
  },
  "@anthropic-ai/sdk": {
    displayName: "Anthropic SDK",
    docsUrl: "https://docs.anthropic.com/",
    versionUrl: (v) => `https://github.com/anthropics/anthropic-sdk-js/releases/tag/sdk-v${v}`,
  },
  "@supabase/supabase-js": {
    displayName: "Supabase JS",
    docsUrl: "https://supabase.com/docs/reference/javascript/",
    versionUrl: (v) =>
      v.endsWith("x")
        ? "https://github.com/supabase/supabase-js/releases"
        : `https://github.com/supabase/supabase-js/releases/tag/v${v}`,
  },
  "@google/generative-ai": {
    displayName: "Gemini API",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    versionUrl: (v) => `https://github.com/google-gemini/generative-ai-js/releases/tag/v${v}`,
  },
  tailwindcss: {
    displayName: "Tailwind CSS",
    docsUrl: "https://tailwindcss.com/docs",
    versionUrl: (v) => `https://github.com/tailwindlabs/tailwindcss/releases/tag/v${v}`,
  },
  "@tanstack/react-start": {
    displayName: "TanStack Start",
    docsUrl: "https://tanstack.com/start/latest/docs/",
    versionUrl: (v) => `https://github.com/TanStack/router/releases/tag/v${v}`,
  },
};

export const serviceUrls: Record<string, string> = {
  Vercel:            "https://vercel.com",
  "GitHub Actions":  "https://github.com/features/actions",
  Supabase:          "https://supabase.com",
  "Anthropic Claude": "https://anthropic.com",
  "Google Gemini":   "https://ai.google.dev",
  Resend:            "https://resend.com",
  "GitHub Pages":    "https://pages.github.com",
};
