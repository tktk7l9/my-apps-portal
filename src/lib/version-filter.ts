import type { TechVersion } from "@/lib/projects";
import type { VersionStatus } from "@/lib/version-status";

/** techVersions を持つ最小限の形。Project 全体を要求しないことで呼び出し側の結合を減らす */
type HasTechVersions = { techVersions: TechVersion[] };

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
