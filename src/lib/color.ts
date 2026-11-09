import {
  COLOR_CHANNEL_MAX,
  HEX_BLUE_START,
  HEX_CHANNEL_LENGTH,
  HEX_GREEN_START,
  HEX_RADIX,
  HEX_RED_START,
  LIGHT_COLOR_LUMINANCE_THRESHOLD,
  LUMINANCE_WEIGHTS,
} from "@/constants/color";

export function isLightColor(hex: string): boolean {
  const channel = (start: number) =>
    parseInt(hex.slice(start, start + HEX_CHANNEL_LENGTH), HEX_RADIX) /
    COLOR_CHANNEL_MAX;
  const luminance =
    LUMINANCE_WEIGHTS.red * channel(HEX_RED_START) +
    LUMINANCE_WEIGHTS.green * channel(HEX_GREEN_START) +
    LUMINANCE_WEIGHTS.blue * channel(HEX_BLUE_START);
  return luminance > LIGHT_COLOR_LUMINANCE_THRESHOLD;
}
