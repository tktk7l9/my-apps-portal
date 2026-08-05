import { afterEach, describe, expect, it, vi } from "vitest";
import { getVersionStatuses } from "@/lib/version-status";

type FetchArgs = Parameters<typeof fetch>;

/** npm registry と OSV の応答を差し替える。
 *  npmVersions に載っていないパッケージは 404 を返す。 */
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
  it("チェック対象外のバージョン表記は unknown にする", async () => {
    const fetchMock = mockFetch({});
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "—" },
      { techName: "Next.js", version: "latest" },
      { techName: "Next.js", version: "16.x" },
    ]);
    expect(statuses["Next.js@—"]).toBe("unknown");
    expect(statuses["Next.js@latest"]).toBe("unknown");
    expect(statuses["Next.js@16.x"]).toBe("unknown");
    // isCheckable でふるい落とされていれば、npm registry には一切問い合わせないはず。
    const calledUrls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.startsWith("https://registry.npmjs.org/"))).toBe(false);
  });

  it("packageMeta に無い技術名は unknown にする", async () => {
    // "next" に実体を持たせておく: 逆引きが誤って解決してしまう回帰があれば
    // このエントリが registry に問い合わせられてしまい、下の検証で捕捉できる。
    const fetchMock = mockFetch({ npmVersions: { next: "16.2.12" } });
    const { statuses } = await getVersionStatuses([
      { techName: "Swift", version: "6.3" },
    ]);
    expect(statuses["Swift@6.3"]).toBe("unknown");
    // displayName → npm 名の逆引きが undefined を返していれば、npm registry には問い合わせないはず。
    const calledUrls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.startsWith("https://registry.npmjs.org/"))).toBe(false);
  });

  it("最新版と一致すれば latest、古ければ outdated にする", async () => {
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

  it("OSV が脆弱性を返したら vulnerable を最優先にする", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, vulnFlags: [true] },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("vulnerable");
  });

  it("npm registry が 404 を返したら unknown にする", async () => {
    mockFetch({ npmVersions: {}, osv: { ok: true, vulnFlags: [false] } });
    const { statuses, latestVersions } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("unknown");
    expect(latestVersions["Next.js@16.2.12"]).toBeUndefined();
  });

  it("OSV がエラー応答を返しても脆弱性なしとして続行する", async () => {
    mockFetch({ npmVersions: { next: "16.2.12" }, osv: { ok: false } });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });

  it("OSV への通信が例外を投げても脆弱性なしとして続行する", async () => {
    mockFetch({
      npmVersions: { next: "16.2.12" },
      osv: { ok: true, throws: true },
    });
    const { statuses } = await getVersionStatuses([
      { techName: "Next.js", version: "16.2.12" },
    ]);
    expect(statuses["Next.js@16.2.12"]).toBe("latest");
  });
});
