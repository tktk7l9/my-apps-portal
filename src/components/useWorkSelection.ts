"use client";

import { useSyncExternalStore } from "react";
import { readWorkParam } from "@/lib/work-param";
import { createWorkNavigator, type Activation } from "@/lib/work-history";

/**
 * Keeps the open detail modal in the URL (`?work=<id>`, SHIG 59, 60, 82).
 *
 * - Opening pushes a history entry, so the browser/OS back gesture closes the modal
 *   instead of leaving the portfolio.
 * - A shared link with `?work=<id>` opens that work on load.
 * - Each section passes its own project list; only the section that owns the id opens it.
 * - History edge cases (double close, re-open) live in work-history.ts.
 *
 * Next.js App Router patches history.pushState/replaceState and keeps its internal
 * state, so native history calls are the supported way to change only the query.
 */
const CHANGE_EVENT = "portal:workchange";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => readWorkParam(window.location.search);
const getServerSnapshot = () => null;

/** One navigator per page, shared by every section so a pending back step is seen by all */
let sharedNavigator: ReturnType<typeof createWorkNavigator> | null = null;
function workNavigator() {
  sharedNavigator ??= createWorkNavigator(window, () => window.dispatchEvent(new Event(CHANGE_EVENT)));
  return sharedNavigator;
}

/** Pass the click event from pointer handlers so a double click cannot open and then close (SHIG 57) */
const open = (project: { id: string }, event?: Activation) => workNavigator().open(project.id, event);
const close = (event?: Activation) => workNavigator().close(event);

/** True right after the modal opened or closed; see work-history.ts */
export const isWorkSettling = () => workNavigator().isSettling();

export function useWorkSelection<T extends { id: string }>(projects: T[]) {
  const workId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const selected = workId ? (projects.find((p) => p.id === workId) ?? null) : null;
  return { selected, open: open as (project: T, event?: Activation) => void, close };
}
