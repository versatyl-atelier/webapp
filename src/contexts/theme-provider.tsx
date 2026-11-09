"use client";

import { ComponentProps, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export const DARK_THEME = "dark";
export const LIGHT_THEME = "light";

function getAppliedTheme() {
  return document.documentElement.classList.contains(DARK_THEME)
    ? DARK_THEME
    : LIGHT_THEME;
}

export function ThemeProvider({
  children,
  forcedTheme,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  const [printTheme, setPrintTheme] = useState<string>();

  useEffect(() => {
    const freezeTheme = () => flushSync(() => setPrintTheme(getAppliedTheme()));
    const releaseTheme = () => setPrintTheme(undefined);
    window.addEventListener("beforeprint", freezeTheme);
    window.addEventListener("afterprint", releaseTheme);
    return () => {
      window.removeEventListener("beforeprint", freezeTheme);
      window.removeEventListener("afterprint", releaseTheme);
    };
  }, []);

  return (
    <NextThemesProvider forcedTheme={forcedTheme ?? printTheme} {...props}>
      {children}
    </NextThemesProvider>
  );
}
