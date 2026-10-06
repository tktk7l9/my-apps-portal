/**
 * Minimal YAML-subset frontmatter parser for content/blog/*.md.
 *
 * Supported (which is all the blog schema needs):
 *   key: scalar                 → string (quotes stripped, `#` comments not supported)
 *   key: [a, b, "c"]            → string[]
 *   key:                        → string[] when followed by `- item` lines
 *     - item
 *   key: []                     → []
 *
 * Anything else throws so a typo in an article fails the content test instead of
 * silently becoming an empty field. A full YAML parser would also pull js-yaml 3.x
 * into the production bundle through gray-matter.
 */

export type FrontmatterValue = string | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

export type ParsedDocument = {
  data: Frontmatter;
  body: string;
};

const DELIMITER = "---";

function unquote(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function parseInlineList(raw: string, key: string): string[] {
  const inner = raw.slice(1, -1).trim();
  if (inner === "") return [];
  // Split on commas outside quotes.
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of inner) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ",") {
      items.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (quote) throw new Error(`frontmatter: unterminated quote in "${key}"`);
  items.push(current);
  return items.map((item) => {
    const value = unquote(item);
    if (value === "") throw new Error(`frontmatter: empty item in "${key}"`);
    return value;
  });
}

/** Splits `---\n...\n---\n` off the top of a Markdown file and parses the YAML subset. */
export function parseFrontmatter(source: string): ParsedDocument {
  const lines = source.split(/\r?\n/);
  if (lines[0] !== DELIMITER) throw new Error("frontmatter: file must start with ---");
  const end = lines.indexOf(DELIMITER, 1);
  if (end === -1) throw new Error("frontmatter: closing --- not found");

  const data: Frontmatter = {};
  let pendingList: { key: string; items: string[] } | null = null;

  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem) {
      if (!pendingList) throw new Error(`frontmatter: list item without a key at line ${i + 1}`);
      const value = unquote(listItem[1]);
      if (value === "") throw new Error(`frontmatter: empty item in "${pendingList.key}"`);
      pendingList.items.push(value);
      continue;
    }

    const entry = /^([A-Za-z][A-Za-z0-9_]*):(.*)$/.exec(line);
    if (!entry) throw new Error(`frontmatter: cannot parse line ${i + 1}: ${line}`);
    const key = entry[1];
    const rest = entry[2].trim();
    if (key in data) throw new Error(`frontmatter: duplicate key "${key}"`);

    if (rest === "") {
      pendingList = { key, items: [] };
      data[key] = pendingList.items;
    } else {
      pendingList = null;
      data[key] = rest.startsWith("[") && rest.endsWith("]") ? parseInlineList(rest, key) : unquote(rest);
    }
  }

  return { data, body: lines.slice(end + 1).join("\n") };
}
