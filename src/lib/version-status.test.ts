import { afterEach, describe, expect, it, vi } from "vitest";
import { getVersionStatuses } from "@/lib/version-status";

type FetchArgs = Parameters<typeof fetch>;

/** Stubs the npm registry and OSV responses.
 *  Packages not listed in npmVersions return 404. */
function mockFetch(options: {
  npmVersions?: Record<string, string>;
  osv?: { ok: boolean; vulnFlags?: boolean[]; throws?: boolean };
}) {
  const { npmVersions = {}, osv = { ok: true, vulnFlags: [] } } = options;

  const impl = vi.fn(async (...args: FetchArgs) => {
    const url = String(args[0]);

    if (url.startsWith("https://registry.npmjs.org/")) {
      const pkg = decodeURIComponent(url.split("/")[3]);
      const version = npmVersions[pkg];
      if (!version) return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ version }), { status: 200 });
    }

    if (url === "https://api.osv.dev/v1/querybatch") {
      if (osv.throws) throw new Error("network down");
      if (!osv.ok) return new Response(null, { status: 500 });
      const results = (osv.vulnFlags ?? []).map((hasVuln) =>
        hasVuln ? { vulns: [{ id: "GHSA-xxxx" }] } : {}
      );
      return new Response(JSON.stringify({ results }), { status: 200 });
    }

    throw new Error(`unexpected fetch: ${url}`);
  });

  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getVersionStatuses", () => {
  it("marks unsupported version notations as unknown", async () => {
    const fetchMock = mockFetch({});
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "—" },
      { techName: "Next.js", version: "latest" },
      { techName: "Next.js", version: "16.x" },
    ]);
    expect(statuses["Next.js@—"]).toBe("unknown");
    expect(statuses["Next.js@latest"]).toBe("unknown");
    expect(statuses["Next.js@16.x"]).toBe("unknown");
    // If isCheckable filtered them out, the npm registry should never be queried.
    const calledUrls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.startsWith("https://registry.npmjs.org/"))).toBe(false);
  });

  it("marks tech names missing from packageMeta as unknown", async () => {
    // Give "next" a real entry: if a regression makes the reverse lookup resolve by mistake,
    // this entry gets queried from the registry and the check below catches it.
    const fetchMock = mockFetch({ npmVersions: { next: "16.2.12" } });
    const { statuses } = await getVersionStatuses([
      { techName: "Swift", version: "6.3" },
    ]);
    expect(statuses["Swift@6.3"]).toBe("unknown");
    // If the displayName → npm name reverse lookup returns undefined, the npm registry should not be queried.
    const calledUrls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.startsWith("https://registry.npmjs.org/"))).toBe(false);
  });

  it("marks latest when it matches the newest version, outdated otherwise", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12", react: "19.2.8" },
      osv: { ok: true, vulnFlags: [false, false] },
    });
    const { statuses, latestVersions } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
      { techName: "React", version: "19.0.0" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
    expect(statuses["React@19.0.0"]).toBe("outdated");
    expect(latestVersions["React@19.0.0"]).toBe("19.2.8");
  });

  it("gives vulnerable top priority when OSV reports a vulnerability", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, vulnFlags: [true] },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("vulnerable");
  });

  it("marks unknown when the npm registry returns 404", async () => {
    mockFetch({ npmVersions: {}, osv: { ok: true, vulnFlags: [false] } });
    const { statuses, latestVersions } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("unknown");
    expect(latestVersions["Next.js@16.2.12"]).toBeUndefined();
  });

  it("continues as not vulnerable when OSV returns an error response", async () => {
    mockFetch({ npmVersions: { next: "16.2.12" }, osv: { ok: false } });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });

  it("continues as not vulnerable when the OSV request throws", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, throws: true },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });

  it("does not query OSV for range-declared versions", async () => {
    // A declaration like acro-finder's `^16.2.10`. The displayed 16.2.10 is the range's
    // lower bound, not what the lockfile resolves, so this prevents picking up the lower bound's
    // vulnerabilities and permanently showing it as vulnerable.
    const fetchMock = mockFetch({
      npmVersions: { next: "16.3.0" },
      osv: { ok: true, vulnFlags: [true] },
    });

    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.10", versionIsRange: true },
    ]);

    // No vulnerability check, but the comparison with the latest version still works as before
    expect(statuses["Next.js@16.2.10"]).toBe("outdated");

    const osvCalls = fetchMock.mock.calls.filter(
      (c) => String(c[0]) === "https://api.osv.dev/v1/querybatch"
    );
    expect(osvCalls).toHaveLength(0);
  });

  it("uses the exact version and queries OSV when the same key also appears pinned", async () => {
    // If another project pins the same version exactly, the real version is known, so querying is fine
    mockFetch({
      npmVersions: { next: "16.3.0" },
      osv: { ok: true, vulnFlags: [true] },
    });

    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.10", versionIsRange: true },
      { techName: "Next.js", version: "16.2.10", versionIsRange: false },
    ]);

    expect(statuses["Next.js@16.2.10"]).toBe("vulnerable");
  });
});
