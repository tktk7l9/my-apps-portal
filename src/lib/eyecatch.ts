import type { RawProject } from "@/lib/projects";

type EyecatchSource = Pick<RawProject, "ogImage" | "liveUrl">;

/** カードのアイキャッチ画像 URL を決める。
 *
 *  優先順は ogImage の明示指定 → liveUrl の OGP スクレイプ → null（emoji フォールバック）。
 *  liveUrl があるのに ogImage を優先するのは、公開サイトでもサーバー側からは
 *  取得できない場合があるため（Vercel Firewall の bot_protection が
 *  challenge を返すサイトは、どの User-Agent でも 429 になりスクレイプが成立しない）。
 */
export function eyecatchSrc(project: EyecatchSource): string | null {
  if (project.ogImage) return project.ogImage;
  if (project.liveUrl) return `/api/ogp?url=${encodeURIComponent(project.liveUrl)}`;
  return null;
}
