export const RICH_TEXT_COLORS = ["red", "green", "blue", "orange"] as const;

export type RichTextColor = (typeof RICH_TEXT_COLORS)[number];

export const RICH_TEXT_COLOR_HEX: Record<RichTextColor, string> = {
  red: "#dc2626",
  green: "#059669",
  blue: "#2563eb",
  orange: "#f9a015",
};

export const RICH_TEXT_COLOR_TEXT_CLASSES: Record<RichTextColor, string> = {
  red: "text-destructive",
  green: "text-punch-pos-diff",
  blue: "text-info",
  orange: "text-warning-foreground",
};

export const RICH_TEXT_COLOR_SWATCH_CLASSES: Record<RichTextColor, string> = {
  red: "bg-destructive",
  green: "bg-punch-pos-diff",
  blue: "bg-info",
  orange: "bg-warning-foreground",
};

export const RICH_TEXT_COLOR_LABELS: Record<RichTextColor, string> = {
  red: "Rouge",
  green: "Vert",
  blue: "Bleu",
  orange: "Orange",
};

export const RICH_TEXT_BOLD_CLASS = "font-bold";
export const RICH_TEXT_ITALIC_CLASS = "italic";
export const RICH_TEXT_UNDERLINE_CLASS = "underline";

export const RICH_TEXT_JSON_PREFIX = "[";
export const RICH_TEXT_NEWLINE = "\n";
export const RICH_TEXT_BOLD_WEIGHT = 600;
export const RICH_TEXT_RGB_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/;
export const RICH_TEXT_HEX_PATTERN = /^#([0-9a-f]{6})$/i;
export const RICH_TEXT_TRAILING_NEWLINES_PATTERN = /\n+$/;
export const RICH_TEXT_HEX_RADIX = 16;
export const RICH_TEXT_HEX_PAIR_LENGTH = 2;

export const RICH_TEXT_BOLD_LABEL = "Gras";
export const RICH_TEXT_ITALIC_LABEL = "Italique";
export const RICH_TEXT_UNDERLINE_LABEL = "Souligné";
export const RICH_TEXT_CLEAR_LABEL = "Effacer la mise en forme";
export const RICH_TEXT_TOOLBAR_LABEL = "Mise en forme du texte";
export const RICH_TEXT_COLOR_PREFIX = "Couleur";

export const RICH_TEXT_COMMANDS = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  foreColor: "foreColor",
  removeFormat: "removeFormat",
} as const;
