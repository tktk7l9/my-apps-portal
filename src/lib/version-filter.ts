import type { TechVersion } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";

/** techVersions を持つ最小限の形。Project 全体を要求しないことで呼び出し側の結合を減らす */
type HasTechVersions = { techVersions: TechVersion[] };

/** getVersionStatuses に渡す照会単位 */
export type VersionCheckEntry = {
  techName: string;
  version: string;
  versionIsRange?: boolean;
};

/**
 * npm registry / OSV への照会対象となる techName@version を集める。
 *
 * `staticTech` を宣言したプロジェクトは npm 監視をバイパスする意図なので除外する。
 * staticTech の version にはメジャーのみ（React "19"）や npm のバージョン体系に
 * 乗らない値（macOS "arm64"）が入るため、そのまま npm registry と比較すると
 * displayName がたまたま npm パッケージ名と一致するもの（React / TypeScript）
 * だけが「アップデートあり」と誤判定される。Electron や CodeMirror が無害なのは
 * packageMeta に登録が無く unknown へ落ちるからにすぎない。
 */
export function collectVersionCheckEntries(
  projects: (HasTechVersions & { staticTech?: unknown })[]
): VersionCheckEntry[] {
  return projects
    .filter((project) => !project.staticTech)
    .flatMap((project) =>
      project.techVersions.map((tech) => ({
        techName: tech.name,
        version: tech.version,
        versionIsRange: tech.versionIsRange,
      }))
    );
}

/**
 * versionStatuses（全プロジェクト分）を、指定した projects が実際に使っている
 * `techName@version` キーだけに絞り込む。
 *
 * ProjectTable は渡された versionStatuses の Object.values() 件数をそのまま
 * 「アップデートあり N 件」として表示するため、テーブルに出さないプロジェクト
 * （代表作・実務案件）の分まで含んだ全体マップを渡すと集計が実際の表示行と
 * 食い違う。呼び出し側でテーブルに載る projects だけに絞ってから渡す。
 */
export function filterVersionStatusesForProjects(
  versionStatuses: Record<string, VersionStatus>,
  projects: HasTechVersions[]
): Record<string, VersionStatus> {
  const keys = new Set<string>();
  for (const project of projects) {
    for (const tech of project.techVersions) {
      keys.add(`${tech.name}@${tech.version}`);
    }
  }

  return Object.fromEntries(
    Object.entries(versionStatuses).filter(([key]) => keys.has(key))
  );
}
