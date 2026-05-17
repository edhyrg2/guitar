import Link from "next/link";
import type { ComponentType } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { ThemeControls } from "@/components/theme-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

type TopNavbarItem = {
  label: string;
  href?: string;
  active?: boolean;
  icon?: IconSvgElement;
  customIcon?: ComponentType<{ className?: string }>;
};

type TopNavbarProps = {
  searchPlaceholder: string;
  items: TopNavbarItem[];
};

export function TopNavbar({ searchPlaceholder, items }: TopNavbarProps) {
  const activeIndex = items.findIndex((item) => item.active);
  const visibleItems =
    activeIndex === -1
      ? items.slice(0, 5)
      : items.slice(
          Math.max(0, activeIndex - 2),
          Math.min(items.length, activeIndex + 3)
        );

  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SidebarTrigger />
          <div className="relative max-w-3xl flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={searchPlaceholder}
              className="h-12 rounded-2xl border-border/70 bg-card pl-11 pr-[4.5rem] text-sm shadow-sm"
            />
            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border/70 bg-background px-2 py-1 text-[0.65rem] font-medium text-muted-foreground">
              Ctrl K
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleItems.map((item) => {
            const content = (
              <>
                {item.icon ? (
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                ) : item.customIcon ? (
                  <item.customIcon className="size-4" />
                ) : null}
                {item.label}
              </>
            );

            if (item.href) {
              return (
                <Button
                  key={item.label}
                  variant={item.active ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={item.href}>{content}</Link>
                </Button>
              );
            }

            return (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                size="sm"
              >
                {content}
              </Button>
            );
          })}
          <ThemeControls compact />
        </div>
      </div>
    </header>
  );
}
