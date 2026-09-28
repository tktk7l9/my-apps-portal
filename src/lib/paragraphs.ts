/** Splits a description into an array of paragraphs.
 *
 *  The data is a single-line string literal, so paragraph breaks are written as newline escapes.
 *  Both `\n\n` and `\n` count as a break (tolerating inconsistent authoring);
 *  surrounding whitespace and empty paragraphs are dropped. Without newlines it returns one paragraph.
 */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
