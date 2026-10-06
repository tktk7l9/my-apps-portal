/** Canonical origin of the portal, shared by metadata, the sitemap, the feed and OG images. */
export const SITE_URL = "https://my-apps-portal.saitotakuya0719.workers.dev";

export const SITE_NAME = "齋藤拓也 ポートフォリオ";

export const BLOG_TITLE = "開発ブログ";
export const BLOG_DESCRIPTION =
  "個人開発した Web アプリの設計・技術選定・更新内容を、実際のリポジトリと計測値をもとに書き残すブログ。";

/** Absolute URL for a site path such as "/blog/foo". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
