"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ComputerIcon,
  DropletIcon,
  Moon01Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";

import {
  appearanceModes,
  COLOR_STORAGE_KEY,
  colorThemes,
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_COLOR_THEME,
  readAppearanceMode,
  readColorTheme,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  type AppearanceMode,
  type ColorTheme,
} from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeControlsProps = {
  compact?: boolean;
};

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

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function ThemeControls({ compact = false }: ThemeControlsProps) {
  const mode = React.useSyncExternalStore(
    subscribe,
    readAppearanceMode,
    () => DEFAULT_APPEARANCE_MODE
  );
  const colorTheme = React.useSyncExternalStore(
    subscribe,
    readColorTheme,
    () => DEFAULT_COLOR_THEME
  );

  const updateMode = (nextMode: AppearanceMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode, colorTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const updateColorTheme = (nextTheme: ColorTheme) => {
    localStorage.setItem(COLOR_STORAGE_KEY, nextTheme);
    applyTheme(mode, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background p-1">
        <div className="flex items-center gap-1">
          {appearanceModes.map((item) => {
            const icon =
              item.id === "light"
                ? Sun01Icon
                : item.id === "dark"
                  ? Moon01Icon
                  : ComputerIcon;

            return (
              <Button
                key={item.id}
                variant={mode === item.id ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => updateMode(item.id)}
                aria-label={`Switch to ${item.label.toLowerCase()} mode`}
              >
                <HugeiconsIcon icon={icon} strokeWidth={2} />
              </Button>
            );
          })}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <HugeiconsIcon
            icon={DropletIcon}
            strokeWidth={2}
            className="text-muted-foreground"
          />
          {colorThemes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateColorTheme(item.id)}
              className={cn(
                "flex size-5 items-center justify-center rounded-full border transition-colors",
                colorTheme === item.id ? "border-foreground" : "border-border"
              )}
              aria-label={`Use ${item.label.toLowerCase()} theme`}
              title={item.label}
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} />
          <span>Appearance</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {appearanceModes.map((item) => (
            <Button
              key={item.id}
              variant={mode === item.id ? "secondary" : "outline"}
              size="sm"
              onClick={() => updateMode(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={DropletIcon} strokeWidth={2} />
          <span>Accent color</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {colorThemes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateColorTheme(item.id)}
              className={cn(
                "flex h-10 items-center justify-center rounded-md border bg-card transition-colors",
                colorTheme === item.id ? "border-foreground" : "border-border"
              )}
              aria-label={`Use ${item.label.toLowerCase()} theme`}
              title={item.label}
            >
              <span
                className="size-4 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                style={{ backgroundColor: item.color }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
