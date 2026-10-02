"use client";

import {
  SEARCH_SHORTCUT_HINT_APPLE,
  SEARCH_SHORTCUT_HINT_DEFAULT,
} from "@/constants/tools";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";

export function SearchShortcutHint() {
  return useIsApplePlatform()
    ? SEARCH_SHORTCUT_HINT_APPLE
    : SEARCH_SHORTCUT_HINT_DEFAULT;
}
