"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readWorkParam, withWorkParam } from "@/lib/work-param";

/**
 * Keeps the open detail modal in the URL (`?work=<id>`, SHIG 59, 60, 82).
 *
 * - Opening pushes a history entry, so the browser/OS back gesture closes the modal
 *   instead of leaving the portfolio.
 * - A shared link with `?work=<id>` opens that work on load.
 * - Each section passes its own project list; only the section that owns the id opens it.
 *
 * Next.js App Router patches history.pushState/replaceState and keeps its internal
 * state, so native history calls are the supported way to change only the query.
 */
const CHANGE_EVENT = "portal:workchange";
/** Marks history entries this hook pushed, so closing can go back instead of stacking entries */
const STATE_KEY = "portalWork";

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

export function useWorkSelection<T extends { id: string }>(projects: T[]) {
  const workId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const selected = workId ? (projects.find((p) => p.id === workId) ?? null) : null;

  const open = useCallback((project: T) => {
    window.history.pushState({ [STATE_KEY]: project.id }, "", withWorkParam(window.location.href, project.id));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const close = useCallback(() => {
    if (window.history.state?.[STATE_KEY]) {
      // Opened from this page: step back so Back does not reopen the modal
      window.history.back();
      return;
    }
    // Opened from a shared link: drop the parameter without leaving the page
    window.history.replaceState(null, "", withWorkParam(window.location.href, null));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { selected, open, close };
}
