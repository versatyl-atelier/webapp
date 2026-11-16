export const LOGO_VIEW_BOX = "11 8 340 340";
export const LOGO_STROKE_WIDTH = 11.5;
export const LOGO_MITER_LIMIT = 10;
export const LOGO_PATH_LENGTH = 1;

export const LOGO_PEACH_POINTS = "163.6,129 186.6,129 114.25,322 102.75,291.3";
export const LOGO_ORANGE_POINTS = "211.6,129 234.6,129 258.7,64.7 247.25,34";
export const LOGO_GREY_POINTS = "175.4,225.5 198.4,225.5 234.6,129 211.6,129";

export type LogoStroke = {
  d: string;
  square?: boolean;
};

export const LOGO_STROKES: readonly LogoStroke[] = [
  { d: "M19 129H41.9L114.25 322L186.6 129" },
  { d: "M102.75 291.3L163.6 129", square: true },
  { d: "M163.6 129H282.9" },
  { d: "M175.4 225.5L247.25 34L319.1 225.5H343.5" },
  { d: "M150.4 225.5H198.4L258.7 64.7" },
];
