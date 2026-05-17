export const colorThemes = [
  { id: "default", label: "Slate", color: "oklch(0.205 0 0)" },
  { id: "emerald", label: "Emerald", color: "oklch(0.62 0.16 160)" },
  { id: "rose", label: "Rose", color: "oklch(0.62 0.21 18)" },
  { id: "amber", label: "Amber", color: "oklch(0.72 0.16 78)" },
] as const;

export const appearanceModes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["id"];
export type AppearanceMode = (typeof appearanceModes)[number]["id"];

export const THEME_STORAGE_KEY = "dashboard-theme-mode";
export const COLOR_STORAGE_KEY = "dashboard-color-theme";
export const THEME_EVENT = "dashboard-theme-change";

export const DEFAULT_APPEARANCE_MODE: AppearanceMode = "system";
export const DEFAULT_COLOR_THEME: ColorTheme = "default";

export function readAppearanceMode(): AppearanceMode {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE_MODE;
  }

  return (
    (localStorage.getItem(THEME_STORAGE_KEY) as AppearanceMode | null) ??
    DEFAULT_APPEARANCE_MODE
  );
}

export function readColorTheme(): ColorTheme {
  if (typeof window === "undefined") {
    return DEFAULT_COLOR_THEME;
  }

  return (
    (localStorage.getItem(COLOR_STORAGE_KEY) as ColorTheme | null) ??
    DEFAULT_COLOR_THEME
  );
}
