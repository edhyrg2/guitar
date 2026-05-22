"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ComputerIcon,
  DropletIcon,
  Moon02Icon,
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

function getEffectiveIsDark(mode: AppearanceMode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  const [colorOpen, setColorOpen] = React.useState(false);
  const colorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const toggleDarkLight = () => {
    const isDark = getEffectiveIsDark(mode);
    updateMode(isDark ? "light" : "dark");
  };

  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(getEffectiveIsDark(mode));
  }, [mode]);

  const activeColor = colorThemes.find((t) => t.id === colorTheme) ?? colorThemes[0];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Dark/Light toggle — single button */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleDarkLight}
          aria-label="Toggle dark mode"
          className="size-8"
        >
          <HugeiconsIcon
            icon={isDark ? Moon02Icon : Sun01Icon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>

        {/* Color theme — single button with popover */}
        <div ref={colorRef} className="relative">
          <button
            type="button"
            onClick={() => setColorOpen((v) => !v)}
            className="flex size-8 items-center justify-center rounded-md transition hover:bg-muted"
            aria-label="Change accent color"
          >
            <span
              className="size-4 rounded-full ring-1 ring-black/10 dark:ring-white/15"
              style={{ backgroundColor: activeColor.color }}
            />
          </button>

          {colorOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border/70 bg-popover p-3 shadow-lg animate-in fade-in slide-in-from-top-2">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Accent Color
              </p>
              <div className="flex items-center gap-2">
                {colorThemes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      updateColorTheme(item.id);
                      setColorOpen(false);
                    }}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border-2 transition",
                      colorTheme === item.id
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-110"
                    )}
                    aria-label={`Use ${item.label} theme`}
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
          )}
        </div>
      </div>
    );
  }

  // Full (non-compact) version for settings pages
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
