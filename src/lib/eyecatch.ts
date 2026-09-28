import type { RawProject } from "@/lib/projects";

type EyecatchSource = Pick<RawProject, "ogImage" | "liveUrl">;

/** Picks the card's eyecatch image URL.
 *
 *  Priority: explicit ogImage → OGP scraped from liveUrl → null (emoji fallback).
 *  ogImage wins even when liveUrl exists because some public sites cannot be
 *  fetched from the server side (sites where Vercel Firewall bot_protection returns
 *  a challenge answer 429 to every User-Agent, so scraping never works).
 */
export function eyecatchSrc(project: EyecatchSource): string | null {
  if (project.ogImage) return project.ogImage;
  if (project.liveUrl) return `/api/ogp?url=${encodeURIComponent(project.liveUrl)}`;
  return null;
}
