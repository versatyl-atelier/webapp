import { useSyncExternalStore } from "react";

import { APPLE_PLATFORM_PATTERN } from "@/constants/tools";

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string };
};

const subscribe = () => () => {};

function getIsApplePlatform(): boolean {
  const nav: NavigatorWithUserAgentData = navigator;
  const platform = nav.userAgentData?.platform ?? nav.platform;
  return APPLE_PLATFORM_PATTERN.test(platform);
}

const getServerIsApplePlatform = () => false;

export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    subscribe,
    getIsApplePlatform,
    getServerIsApplePlatform,
  );
}
