import { packageMeta } from "@/lib/projects";

export type VersionStatus = "latest" | "outdated" | "vulnerable" | "unknown";

export type GetVersionStatusesResult = {
  statuses: Record<string, VersionStatus>;
  latestVersions: Record<string, string>; // key: "techName@version", value: latest version string
};

const npmNames: Record<string, string> = Object.fromEntries(
  Object.entries(packageMeta).map(([npmName, meta]) => [meta.displayName, npmName])
);

const isCheckable = (v: string) =>
  v !== "—" && v !== "latest" && !v.endsWith("x");

async function fetchLatestVersions(pkgs: string[]): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    pkgs.map(async (pkg): Promise<[string, string]> => {
      const res = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error(`${pkg}: ${res.status}`);
      const data = await res.json() as { version: string };
      return [pkg, data.version];
    })
  );
  return Object.fromEntries(
    results
      .filter((r): r is PromiseFulfilledResult<[string, string]> => r.status === "fulfilled")
      .map((r) => r.value)
  );
}

async function fetchVulnerableKeys(
  queries: { key: string; pkg: string; version: string }[]
): Promise<Set<string>> {
  try {
    const body = {
      queries: queries.map(({ pkg, version }) => ({
        version,
        package: { name: pkg, ecosystem: "npm" },
      })),
    };
    const res = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Set();
    const data = await res.json() as { results: { vulns?: unknown[] }[] };
    const vulnKeys = new Set<string>();
    data.results.forEach((result, i) => {
      if (result.vulns && result.vulns.length > 0) {
        vulnKeys.add(queries[i].key);
      }
    });
    return vulnKeys;
  } catch {
    return new Set();
  }
}

export async function getVersionStatuses(
  entries: { techName: string; version: string }[]
): Promise<GetVersionStatusesResult> {
  const checkable = entries.filter(({ version }) => isCheckable(version));

  const uniquePkgs = [
    ...new Set(checkable.map(({ techName }) => npmNames[techName]).filter(Boolean)),
  ];

  const osvQueries = checkable
    .map(({ techName, version }) => ({
      key: `${techName}@${version}`,
      pkg: npmNames[techName],
      version,
    }))
    .filter(({ pkg }) => Boolean(pkg));

  const [latestMap, vulnKeys] = await Promise.all([
    fetchLatestVersions(uniquePkgs),
    fetchVulnerableKeys(osvQueries),
  ]);

  const statuses: Record<string, VersionStatus> = {};
  const latestVersions: Record<string, string> = {};
  for (const { techName, version } of entries) {
    const key = `${techName}@${version}`;
    if (!isCheckable(version)) {
      statuses[key] = "unknown";
      continue;
    }
    const pkg = npmNames[techName];
    if (!pkg) { statuses[key] = "unknown"; continue; }

    if (latestMap[pkg]) latestVersions[key] = latestMap[pkg];

    if (vulnKeys.has(key)) {
      statuses[key] = "vulnerable";
    } else if (!latestMap[pkg]) {
      statuses[key] = "unknown";
    } else if (latestMap[pkg] === version) {
      statuses[key] = "latest";
    } else {
      statuses[key] = "outdated";
    }
  }
  return { statuses, latestVersions };
}
