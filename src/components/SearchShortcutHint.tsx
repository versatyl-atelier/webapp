"use client";

import { useSyncExternalStore } from "react";

import {
  APPLE_PLATFORM_PATTERN,
  SEARCH_SHORTCUT_HINT_APPLE,
  SEARCH_SHORTCUT_HINT_DEFAULT,
} from "@/constants/tools";

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string };
};

const subscribe = () => () => {};

function getHint(): string {
  const nav: NavigatorWithUserAgentData = navigator;
  const platform = nav.userAgentData?.platform ?? nav.platform;
  return APPLE_PLATFORM_PATTERN.test(platform)
    ? SEARCH_SHORTCUT_HINT_APPLE
    : SEARCH_SHORTCUT_HINT_DEFAULT;
}

const getServerHint = () => SEARCH_SHORTCUT_HINT_DEFAULT;

export function SearchShortcutHint() {
  return useSyncExternalStore(subscribe, getHint, getServerHint);
}
