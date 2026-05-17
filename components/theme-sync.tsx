"use client";

import * as React from "react";

import {
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_COLOR_THEME,
  THEME_EVENT,
  type AppearanceMode,
  type ColorTheme,
} from "@/lib/theme";

function applyTheme(mode: AppearanceMode, colorTheme: ColorTheme) {
  const root = document.documentElement;
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
  root.dataset.themeMode = mode;
  root.dataset.colorTheme = colorTheme;
}

export function ThemeSync() {
  React.useEffect(() => {
    const syncTheme = () => {
      const mode =
        (localStorage.getItem("dashboard-theme-mode") as AppearanceMode | null) ??
        DEFAULT_APPEARANCE_MODE;
      const colorTheme =
        (localStorage.getItem("dashboard-color-theme") as ColorTheme | null) ??
        DEFAULT_COLOR_THEME;

      applyTheme(mode, colorTheme);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncTheme);
    window.addEventListener(THEME_EVENT, syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(THEME_EVENT, syncTheme);
    };
  }, []);

  return null;
}
