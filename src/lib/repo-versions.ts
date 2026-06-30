import {
  packageMeta,
  type Project,
  type RawProject,
  type TechVersion,
} from "@/lib/projects";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function stripRange(raw: string): string {
  return raw.replace(/^[\s^~>=<]+/, "").trim();
}

async function fetchPublicPackageJson(
  owner: string,
  repo: string
): Promise<PackageJson | null> {
  for (const branch of ["main", "master"]) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) return (await res.json()) as PackageJson;
    } catch {
      // try next branch
    }
  }
  return null;
}

async function fetchPrivatePackageJson(
  owner: string,
  repo: string
): Promise<PackageJson | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as PackageJson;
  } catch {
    return null;
  }
}

async function fetchPackageJson(
  githubUrl: string,
  isPrivate: boolean
): Promise<PackageJson | null> {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) return null;
  const [, owner, repo] = match;

  return isPrivate
    ? fetchPrivatePackageJson(owner, repo)
    : fetchPublicPackageJson(owner, repo);
}

function buildTechVersions(
  trackedPackages: string[],
  pkg: PackageJson | null
): TechVersion[] {
  const allDeps: Record<string, string> = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  return trackedPackages.flatMap((npmName) => {
    const meta = packageMeta[npmName];
    if (!meta) return [];
    const raw = allDeps[npmName];
    const version = raw ? stripRange(raw) : "—";
    const versionUrl = version !== "—" ? meta.versionUrl(version) : undefined;
    return [{
      name: meta.displayName,
      docsUrl: meta.docsUrl,
      version,
      versionUrl,
    }];
  });
}

export async function enrichProjectsWithVersions(
  rawProjects: RawProject[]
): Promise<Project[]> {
  const pkgs = await Promise.all(
    rawProjects.map((p) =>
      p.staticTech || p.trackedPackages.length === 0
        ? Promise.resolve<PackageJson | null>(null)
        : fetchPackageJson(p.githubUrl, p.githubVisibility === "private")
    )
  );

  return rawProjects.map((p, i) => ({
    ...p,
    // Apps that declare staticTech (e.g. native Swift) bypass npm monitoring.
    techVersions: p.staticTech ?? buildTechVersions(p.trackedPackages, pkgs[i]),
  }));
}
