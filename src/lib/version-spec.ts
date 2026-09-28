/**
 * Parses a package.json dependency spec into a displayable version (SHIG 1, 28).
 *
 * Specs such as "latest", "workspace:*" or "github:owner/repo" are not version numbers;
 * showing them as a version ("latest" in grey) is noise, so they return null.
 */
export function parseDeclaredVersion(
  raw: string | undefined
): { version: string; isRange: boolean } | null {
  if (!raw) return null;
  const version = raw.replace(/^[\s^~>=<]+/, "").trim();
  if (!/^\d+(\.(\d+|x)){0,2}([-+][0-9A-Za-z.-]+)?$/.test(version)) return null;
  return { version, isRange: raw.trim() !== version };
}
