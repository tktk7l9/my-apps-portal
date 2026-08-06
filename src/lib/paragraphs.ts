/** 説明文を段落の配列に分解する。
 *
 *  データ側は 1 行の文字列リテラルなので、段落の区切りは改行エスケープで表す。
 *  `\n\n` でも `\n` でも段落として扱い（書き分けの揺れを許容する）、
 *  前後の空白と空段落は落とす。改行が無ければ 1 段落として返す。
 */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
