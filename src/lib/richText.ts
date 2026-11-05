import {
  RICH_TEXT_BOLD_WEIGHT,
  RICH_TEXT_COLORS,
  RICH_TEXT_COLOR_HEX,
  RICH_TEXT_HEX_PAIR_LENGTH,
  RICH_TEXT_HEX_PATTERN,
  RICH_TEXT_HEX_RADIX,
  RICH_TEXT_JSON_PREFIX,
  RICH_TEXT_NEWLINE,
  RICH_TEXT_RGB_PATTERN,
  RICH_TEXT_TRAILING_NEWLINES_PATTERN,
  type RichTextColor,
} from "@/constants/richText";

export type RichRun = {
  text: string;
  bold?: true;
  italic?: true;
  underline?: true;
  color?: RichTextColor;
};

type Format = Omit<RichRun, "text">;

export type RichNode = {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
  childNodes: ArrayLike<RichNode>;
  getAttribute?: (name: string) => string | null;
  style?: {
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecorationLine?: string;
    textDecoration?: string;
  };
};

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const BOLD_TAGS = new Set(["B", "STRONG"]);
const ITALIC_TAGS = new Set(["I", "EM"]);
const UNDERLINE_TAGS = new Set(["U"]);
const BLOCK_TAGS = new Set(["DIV", "P", "LI"]);
const LINE_BREAK_TAG = "BR";
const COLOR_ATTRIBUTE = "color";
const UNDERLINE_KEYWORD = "underline";
const ITALIC_KEYWORD = "italic";
const BOLD_KEYWORD = "bold";

function isColor(value: unknown): value is RichTextColor {
  return (
    typeof value === "string" &&
    (RICH_TEXT_COLORS as readonly string[]).includes(value)
  );
}

function sameFormat(a: Format, b: Format): boolean {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.color === b.color
  );
}

function formatOf({ text: _text, ...format }: RichRun): Format {
  return format;
}

export function normalizeRuns(runs: readonly RichRun[]): RichRun[] {
  const merged: RichRun[] = [];
  for (const run of runs) {
    if (run.text === "") {
      continue;
    }
    const last = merged[merged.length - 1];
    if (last && sameFormat(formatOf(last), formatOf(run))) {
      last.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}

function toRun(value: unknown): RichRun | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { t, b, i, u, c } = value as Record<string, unknown>;
  if (typeof t !== "string") {
    return null;
  }
  const run: RichRun = { text: t };
  if (b === true) run.bold = true;
  if (i === true) run.italic = true;
  if (u === true) run.underline = true;
  if (isColor(c)) run.color = c;
  return run;
}

export function parseRichText(stored: string): RichRun[] {
  if (stored.startsWith(RICH_TEXT_JSON_PREFIX)) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const runs = parsed.map(toRun);
        if (runs.every((run): run is RichRun => run !== null)) {
          return normalizeRuns(runs);
        }
      }
    } catch {
      return normalizeRuns([{ text: stored }]);
    }
  }
  return normalizeRuns([{ text: stored }]);
}

export function serializeRichText(runs: readonly RichRun[]): string {
  const normalized = normalizeRuns(runs);
  if (normalized.length === 0) {
    return "";
  }
  const isPlain =
    normalized.length === 1 &&
    Object.keys(normalized[0]).length === 1 &&
    !normalized[0].text.startsWith(RICH_TEXT_JSON_PREFIX);
  if (isPlain) {
    return normalized[0].text;
  }
  return JSON.stringify(
    normalized.map((run) => ({
      t: run.text,
      ...(run.bold && { b: true }),
      ...(run.italic && { i: true }),
      ...(run.underline && { u: true }),
      ...(run.color && { c: run.color }),
    })),
  );
}

export function normalizeStoredRichText(stored: string): string {
  return serializeRichText(parseRichText(stored));
}

export function richTextPlainLength(stored: string): number {
  return parseRichText(stored).reduce((sum, run) => sum + run.text.length, 0);
}

export function colorFromCss(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  const hexMatch = RICH_TEXT_HEX_PATTERN.exec(value.trim());
  const rgbMatch = RICH_TEXT_RGB_PATTERN.exec(value.trim());
  const hex = hexMatch
    ? `#${hexMatch[1].toLowerCase()}`
    : rgbMatch
      ? `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
          .map((channel) =>
            Number(channel)
              .toString(RICH_TEXT_HEX_RADIX)
              .padStart(RICH_TEXT_HEX_PAIR_LENGTH, "0"),
          )
          .join("")}`
      : null;
  if (hex === null) {
    return undefined;
  }
  return RICH_TEXT_COLORS.find((color) => RICH_TEXT_COLOR_HEX[color] === hex);
}

function elementFormat(node: RichNode, inherited: Format): Format {
  const format: Format = { ...inherited };
  const style = node.style;
  if (BOLD_TAGS.has(node.nodeName)) format.bold = true;
  if (ITALIC_TAGS.has(node.nodeName)) format.italic = true;
  if (UNDERLINE_TAGS.has(node.nodeName)) format.underline = true;
  if (style) {
    const weight = style.fontWeight ?? "";
    if (weight === BOLD_KEYWORD || Number(weight) >= RICH_TEXT_BOLD_WEIGHT) {
      format.bold = true;
    }
    if (style.fontStyle === ITALIC_KEYWORD) format.italic = true;
    const decoration = `${style.textDecorationLine ?? ""} ${style.textDecoration ?? ""}`;
    if (decoration.includes(UNDERLINE_KEYWORD)) format.underline = true;
  }
  const color =
    colorFromCss(node.getAttribute?.(COLOR_ATTRIBUTE)) ??
    colorFromCss(style?.color);
  if (color) format.color = color;
  return format;
}

export function richTextFromDom(root: RichNode): RichRun[] {
  const runs: RichRun[] = [];

  function endsWithNewline(): boolean {
    const last = runs[runs.length - 1];
    return last === undefined || last.text.endsWith(RICH_TEXT_NEWLINE);
  }

  function walk(node: RichNode, inherited: Format) {
    if (node.nodeType === TEXT_NODE) {
      runs.push({ ...inherited, text: node.nodeValue ?? "" });
      return;
    }
    if (node.nodeType !== ELEMENT_NODE) {
      return;
    }
    if (node.nodeName === LINE_BREAK_TAG) {
      runs.push({ ...inherited, text: RICH_TEXT_NEWLINE });
      return;
    }
    const isBlock = BLOCK_TAGS.has(node.nodeName);
    if (isBlock && !endsWithNewline()) {
      runs.push({ text: RICH_TEXT_NEWLINE });
    }
    const format = elementFormat(node, inherited);
    for (let index = 0; index < node.childNodes.length; index += 1) {
      walk(node.childNodes[index], format);
    }
  }

  for (let index = 0; index < root.childNodes.length; index += 1) {
    walk(root.childNodes[index], {});
  }
  const normalized = normalizeRuns(runs);
  const last = normalized[normalized.length - 1];
  if (last) {
    last.text = last.text.replace(/\n+$/, "");
  }
  return normalizeRuns(normalized);
}
