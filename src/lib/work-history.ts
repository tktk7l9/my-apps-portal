import { readWorkParam, withWorkParam } from "@/lib/work-param";

/**
 * History handling for the detail modal (`?work=<id>`, SHIG 59, 60, 82).
 *
 * Kept free of React so the edge cases can be unit tested with a fake window:
 * - Closing a modal opened on this page steps back, so Back does not reopen it.
 * - Closing twice before the popstate arrives (double click on the close button or
 *   the backdrop, Escape + click) must step back only once; a second `history.back()`
 *   would leave the portfolio for the previous site (SHIG 57, 54).
 * - Opening the work that is already open does not stack a second history entry,
 *   which would make the first close leave the modal on screen.
 */

/** Marks history entries pushed by `open`, so `close` can go back instead of stacking entries */
export const WORK_STATE_KEY = "portalWork";

export type WorkWindow = {
  location: { href: string };
  history: {
    readonly state: unknown;
    pushState(data: unknown, unused: string, url: string): void;
    replaceState(data: unknown, unused: string, url: string): void;
    back(): void;
  };
  addEventListener(type: "popstate", listener: () => void, options: { once: true }): void;
};

function isWorkEntry(state: unknown): boolean {
  return typeof state === "object" && state !== null && WORK_STATE_KEY in state;
}

export function createWorkNavigator(win: WorkWindow, notify: () => void) {
  let backPending = false;
  const currentId = () => readWorkParam(new URL(win.location.href).search);

  return {
    open(id: string) {
      if (backPending || currentId() === id) return;
      win.history.pushState({ [WORK_STATE_KEY]: id }, "", withWorkParam(win.location.href, id));
      notify();
    },
    close() {
      if (backPending || currentId() === null) return;
      if (isWorkEntry(win.history.state)) {
        // Opened from this page: step back once and ignore further closes until it lands
        backPending = true;
        win.addEventListener("popstate", () => { backPending = false; }, { once: true });
        win.history.back();
        return;
      }
      // Opened from a shared link: drop the parameter without leaving the page
      win.history.replaceState(null, "", withWorkParam(win.location.href, null));
      notify();
    },
  };
}
