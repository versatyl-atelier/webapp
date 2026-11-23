import { join } from "node:path";

import type { Mode } from "./config";
import type { Shot, Target } from "./types";

const HOME_SLUG = "home";
const FULL_PAGE_SLUG = "full-page";
const PRINT_SLUG = "print";
const SLUG_SEPARATOR = "-";
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_SEPARATORS = /^-+|-+$/g;
const NAME_PART_SEPARATOR = ".";
const WIDTH_SUFFIX = "w";
const PNG_EXTENSION = "png";
const DEFAULT_MODE: Mode = "light";

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, SLUG_SEPARATOR)
    .replace(EDGE_SEPARATORS, "");
}

function targetName(target: Target) {
  if (target.kind === "viewport") {
    return null;
  }
  if (target.kind === "fullPage") {
    return FULL_PAGE_SLUG;
  }
  return `${target.kind}${SLUG_SEPARATOR}${slug(target.selector)}`;
}

export function shotKey({ page, target, mode, width }: Omit<Shot, "env">) {
  const print = mode === PRINT_SLUG;
  return [
    slug(page) || HOME_SLUG,
    print ? null : targetName(target),
    print ? PRINT_SLUG : `${width}${WIDTH_SUFFIX}`,
    print || mode === DEFAULT_MODE ? null : mode,
    PNG_EXTENSION,
  ]
    .filter(Boolean)
    .join(NAME_PART_SEPARATOR);
}

export function shotFile(shot: Shot) {
  return join(shot.env, shotKey(shot));
}

export function targetLabel(target: Target) {
  if (target.kind === "viewport" || target.kind === "fullPage") {
    return target.kind;
  }
  return `${target.kind} ${target.selector}`;
}

export function shotLabel({ page, target, mode, width }: Omit<Shot, "env">) {
  if (mode === PRINT_SLUG) {
    return `${page} · print`;
  }
  return `${page} · ${targetLabel(target)} · ${width}px · ${mode}`;
}
