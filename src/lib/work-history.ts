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
 * - A double click on a card must not open and then immediately close the modal: the
 *   second click lands on the backdrop that has just appeared. Likewise a double click on
 *   the backdrop must not close and reopen via a card behind it. After each open/close,
 *   pointer clicks are ignored for ACTIVATION_GUARD_MS (SHIG 57). Keyboard actions
 *   (Escape, Enter/Space on a button) are never delayed.
 */

/**
 * How long the page ignores pointer clicks after an open or close.
 * Matches the common OS double-click interval (Windows and macOS default to about 500 ms).
 */
export const ACTIVATION_GUARD_MS = 500;

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

/** The part of a DOM click (or keyboard) event the guard needs; `detail` is 0 for keyboard activation */
export type Activation = { detail: number };

export function createWorkNavigator(
  win: WorkWindow,
  notify: () => void,
  now: () => number = Date.now,
) {
  let backPending = false;
  let lastChangeAt = Number.NEGATIVE_INFINITY;
  const currentId = () => readWorkParam(new URL(win.location.href).search);
  const isSettling = () => now() - lastChangeAt < ACTIVATION_GUARD_MS;

  return {
    /** True right after an open or close; stray clicks from the same double click should be ignored */
    isSettling,
    /** Pass the click event so the tail of a double click is ignored; omit it for keyboard/programmatic calls */
    open(id: string, event?: Activation) {
      if (backPending || (event && isStrayClick(event, isSettling())) || currentId() === id) return;
      lastChangeAt = now();
      win.history.pushState({ [WORK_STATE_KEY]: id }, "", withWorkParam(win.location.href, id));
      notify();
    },
    close(event?: Activation) {
      if (backPending || (event && isStrayClick(event, isSettling())) || currentId() === null) return;
      lastChangeAt = now();
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

/**
 * A pointer click that arrives while the modal is still settling is the tail of the
 * double click that opened it: it must not follow a link that happened to render under
 * the pointer (SHIG 57). Keyboard activation reports `detail === 0` and always passes.
 */
export function isStrayClick(event: Activation, settling: boolean): boolean {
  return settling && event.detail > 0;
}
