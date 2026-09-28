/**
 * URL helpers for the detail modal (SHIG 59/60/82).
 * The open work is reflected in `?work=<id>` so the browser back gesture closes the
 * modal and a specific work can be linked or shared.
 */

export const WORK_PARAM = "work";

/** Returns the work id in a `location.search` string, or null when absent/empty */
export function readWorkParam(search: string): string | null {
  const value = new URLSearchParams(search).get(WORK_PARAM);
  return value ? value : null;
}

/**
 * Returns a same-origin relative URL (path + query + hash) for `href`
 * with the work parameter set to `id`, or removed when `id` is null.
 */
export function withWorkParam(href: string, id: string | null): string {
  const url = new URL(href);
  if (id === null) {
    url.searchParams.delete(WORK_PARAM);
  } else {
    url.searchParams.set(WORK_PARAM, id);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
