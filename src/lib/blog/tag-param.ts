/** `?tag=<tag>` on /blog, so a filtered list can be linked and the back button restores it (SHIG 59). */
const TAG_PARAM = "tag";

export function readTagParam(search: string): string | null {
  const value = new URLSearchParams(search).get(TAG_PARAM);
  return value ? value : null;
}

export function blogListHref(tag: string | null): string {
  return tag === null ? "/blog" : `/blog?${TAG_PARAM}=${encodeURIComponent(tag)}`;
}
