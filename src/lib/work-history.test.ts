import { describe, expect, it, vi } from "vitest";
import { ACTIVATION_GUARD_MS, createWorkNavigator, isStrayClick, swallowStray, WORK_STATE_KEY, type WorkWindow } from "@/lib/work-history";

/** Minimal in-memory session history: back() fires popstate asynchronously, like browsers do */
function fakeWindow(startUrl = "https://example.com/") {
  const entries: { state: unknown; url: string }[] = [{ state: null, url: startUrl }];
  let index = 0;
  let listeners: (() => void)[] = [];
  let pendingPops = 0;
  const win: WorkWindow & { flush(): void; index(): number; length(): number; leftSite(): boolean } = {
    location: {
      get href() {
        return index < 0 ? "about:blank" : new URL(entries[index].url, startUrl).href;
      },
    },
    history: {
      get state() {
        return index < 0 ? null : entries[index].state;
      },
      pushState(state, _unused, url) {
        entries.splice(index + 1);
        entries.push({ state, url });
        index += 1;
      },
      replaceState(state, _unused, url) {
        entries[index] = { state, url };
      },
      back() {
        pendingPops += 1;
      },
    },
    addEventListener(_type, listener) {
      listeners.push(listener);
    },
    flush() {
      for (; pendingPops > 0; pendingPops -= 1) {
        index -= 1;
        const fired = listeners;
        listeners = [];
        fired.forEach((l) => l());
      }
    },
    index: () => index,
    length: () => entries.length,
    leftSite: () => index < 0,
  };
  return win;
}

/** A user who acts slower than a double click: every reading of the clock is past the guard window */
function slowClock() {
  let t = 0;
  return () => (t += ACTIVATION_GUARD_MS);
}

describe("createWorkNavigator", () => {
  it("pushes a marked entry with ?work=<id> on open and notifies", () => {
    const win = fakeWindow();
    const notify = vi.fn();
    createWorkNavigator(win, notify, slowClock()).open("skydial");
    expect(win.location.href).toBe("https://example.com/?work=skydial");
    expect(win.history.state).toEqual({ [WORK_STATE_KEY]: "skydial" });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("does not stack a second entry when the same work is opened twice", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {}, slowClock());
    nav.open("skydial");
    nav.open("skydial");
    expect(win.length()).toBe(2);
    nav.close();
    win.flush();
    expect(win.location.href).toBe("https://example.com/");
  });

  it("steps back once when closed twice before popstate arrives (double click)", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {}, slowClock());
    nav.open("skydial");
    nav.close();
    nav.close();
    win.flush();
    expect(win.leftSite()).toBe(false);
    expect(win.location.href).toBe("https://example.com/");
  });

  it("ignores open while a back step is still pending", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {}, slowClock());
    nav.open("skydial");
    nav.close();
    nav.open("other");
    win.flush();
    expect(win.location.href).toBe("https://example.com/");
    nav.open("other");
    expect(win.location.href).toBe("https://example.com/?work=other");
  });

  it("removes the parameter in place when the modal came from a shared link", () => {
    const win = fakeWindow("https://example.com/?work=skydial&a=1");
    const notify = vi.fn();
    const nav = createWorkNavigator(win, notify, slowClock());
    nav.close();
    expect(win.index()).toBe(0);
    expect(win.location.href).toBe("https://example.com/?a=1");
    expect(notify).toHaveBeenCalledTimes(1);
    nav.close();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("does nothing on close when no work is open", () => {
    const win = fakeWindow();
    const notify = vi.fn();
    createWorkNavigator(win, notify, slowClock()).close();
    expect(win.length()).toBe(1);
    expect(notify).not.toHaveBeenCalled();
  });

  describe("double activation (a double click that opens or closes the modal, SHIG 57)", () => {
    /** Fake clock so the guard window can be stepped through deterministically */
    function clock(start = 1_000) {
      let t = start;
      return { now: () => t, advance: (ms: number) => { t += ms; } };
    }

    it("ignores a click that closes right after open (second click lands on the backdrop)", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.open("skydial", { detail: 1 });
      c.advance(120);
      nav.close({ detail: 2 });
      win.flush();
      expect(win.location.href).toBe("https://example.com/?work=skydial");
    });

    it("closes normally once the guard window has passed", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.open("skydial", { detail: 1 });
      c.advance(ACTIVATION_GUARD_MS);
      nav.close({ detail: 1 });
      win.flush();
      expect(win.location.href).toBe("https://example.com/");
    });

    it("never delays keyboard or programmatic closes (Escape right after open)", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.open("skydial", { detail: 0 });
      c.advance(50);
      nav.close();
      win.flush();
      expect(win.location.href).toBe("https://example.com/");
    });

    it("lets a keyboard click (detail 0) close right after open", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.open("skydial");
      c.advance(50);
      nav.close({ detail: 0 });
      win.flush();
      expect(win.location.href).toBe("https://example.com/");
    });

    it("ignores a click that opens right after close (second click lands on a card behind)", () => {
      const win = fakeWindow("https://example.com/?work=skydial");
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.close({ detail: 1 });
      c.advance(120);
      nav.open("other", { detail: 2 });
      expect(win.location.href).toBe("https://example.com/");
      c.advance(ACTIVATION_GUARD_MS);
      nav.open("other", { detail: 1 });
      expect(win.location.href).toBe("https://example.com/?work=other");
    });

    it("reports whether the page is still settling from the last open or close", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      expect(nav.isSettling()).toBe(false);
      nav.open("skydial");
      expect(nav.isSettling()).toBe(true);
      c.advance(ACTIVATION_GUARD_MS - 1);
      expect(nav.isSettling()).toBe(true);
      c.advance(1);
      expect(nav.isSettling()).toBe(false);
    });

    it("does not start a guard window for ignored actions", () => {
      const win = fakeWindow();
      const c = clock();
      const nav = createWorkNavigator(win, () => {}, c.now);
      nav.close();
      expect(nav.isSettling()).toBe(false);
      nav.open("skydial");
      c.advance(ACTIVATION_GUARD_MS);
      nav.open("skydial");
      expect(nav.isSettling()).toBe(false);
    });
  });
});

describe("isStrayClick", () => {
  it("swallows pointer clicks while the modal is settling (a link under the second click)", () => {
    expect(isStrayClick({ detail: 1 }, true)).toBe(true);
    expect(isStrayClick({ detail: 2 }, true)).toBe(true);
  });

  it("lets keyboard activation through (detail 0), even while settling", () => {
    expect(isStrayClick({ detail: 0 }, true)).toBe(false);
  });

  it("lets every click through once the page has settled", () => {
    expect(isStrayClick({ detail: 1 }, false)).toBe(false);
  });
});

describe("swallowStray", () => {
  const event = (detail: number) => ({ detail, preventDefault: vi.fn(), stopPropagation: vi.fn() });

  it("cancels the stray click and keeps it from reaching the backdrop's close handler", () => {
    const e = event(2);
    expect(swallowStray(e, true, "click")).toBe(true);
    expect(e.preventDefault).toHaveBeenCalledOnce();
    expect(e.stopPropagation).toHaveBeenCalledOnce();
  });

  it("cancels only the default of the stray press, so no word is selected and focus stays put", () => {
    const e = event(2);
    expect(swallowStray(e, true, "mousedown")).toBe(true);
    expect(e.preventDefault).toHaveBeenCalledOnce();
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it("leaves keyboard activation and settled clicks untouched", () => {
    for (const [e, settling] of [[event(0), true], [event(1), false]] as const) {
      expect(swallowStray(e, settling, "click")).toBe(false);
      expect(e.preventDefault).not.toHaveBeenCalled();
      expect(e.stopPropagation).not.toHaveBeenCalled();
    }
  });
});
