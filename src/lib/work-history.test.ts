import { describe, expect, it, vi } from "vitest";
import { createWorkNavigator, WORK_STATE_KEY, type WorkWindow } from "@/lib/work-history";

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

describe("createWorkNavigator", () => {
  it("pushes a marked entry with ?work=<id> on open and notifies", () => {
    const win = fakeWindow();
    const notify = vi.fn();
    createWorkNavigator(win, notify).open("skydial");
    expect(win.location.href).toBe("https://example.com/?work=skydial");
    expect(win.history.state).toEqual({ [WORK_STATE_KEY]: "skydial" });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("does not stack a second entry when the same work is opened twice", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {});
    nav.open("skydial");
    nav.open("skydial");
    expect(win.length()).toBe(2);
    nav.close();
    win.flush();
    expect(win.location.href).toBe("https://example.com/");
  });

  it("steps back once when closed twice before popstate arrives (double click)", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {});
    nav.open("skydial");
    nav.close();
    nav.close();
    win.flush();
    expect(win.leftSite()).toBe(false);
    expect(win.location.href).toBe("https://example.com/");
  });

  it("ignores open while a back step is still pending", () => {
    const win = fakeWindow();
    const nav = createWorkNavigator(win, () => {});
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
    const nav = createWorkNavigator(win, notify);
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
    createWorkNavigator(win, notify).close();
    expect(win.length()).toBe(1);
    expect(notify).not.toHaveBeenCalled();
  });
});
