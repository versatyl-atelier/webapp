export const LIGHT_COLOR_LUMINANCE_THRESHOLD = 0.6;
export const COLOR_CHANNEL_MAX = 255;
export const LUMINANCE_WEIGHTS = { red: 0.299, green: 0.587, blue: 0.114 };
export const HEX_RED_START = 1;
export const HEX_GREEN_START = 3;
export const HEX_BLUE_START = 5;
export const HEX_CHANNEL_LENGTH = 2;
export const HEX_RADIX = 16;

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export const HEX_COLOR_FORMAT = "hex";

export const COLOR_NAMES = [
  "blue",
  "teal",
  "purple",
  "orange",
  "pink",
  "indigo",
  "lime",
  "amber",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];

export const NAMED_COLORS: Record<ColorName, string> = {
  blue: "#3B7DD8",
  teal: "#0F9E7B",
  purple: "#8B5CF6",
  orange: "#E07C3A",
  pink: "#C2507A",
  indigo: "#4F63D2",
  lime: "#5F9E3A",
  amber: "#C9850C",
};

export const COLOR_NAME_LABELS: Record<ColorName, string> = {
  blue: "Bleu",
  teal: "Sarcelle",
  purple: "Violet",
  orange: "Orange",
  pink: "Rose",
  indigo: "Indigo",
  lime: "Lime",
  amber: "Ambre",
};

export type ColorOption = { value: string; label: string };

export const COLOR_SWATCHES: readonly ColorOption[] = COLOR_NAMES.map(
  (name) => ({ value: NAMED_COLORS[name], label: COLOR_NAME_LABELS[name] }),
);

export const COLOR_PICKER_LOCALE = "fr-CA";
export const COLOR_SWATCHES_LABEL = "Couleurs suggérées";
export const CUSTOM_COLOR_LABEL = "Couleur personnalisée";
export const COLOR_AREA_LABEL = "Saturation et luminosité";
export const COLOR_HUE_LABEL = "Teinte";
export const COLOR_HEX_LABEL = "Code hexadécimal";
