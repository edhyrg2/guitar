import Link from "next/link";
import type { ComponentType } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import { ThemeControls } from "@/components/theme-controls";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

type TopNavbarItem = {
  label: string;
  href?: string;
  active?: boolean;
  icon?: IconSvgElement;
  customIcon?: ComponentType<{ className?: string }>;
};

type TopNavbarProps = {
  searchPlaceholder?: string;
  items: TopNavbarItem[];
};

export function TopNavbar({ items }: TopNavbarProps) {
  const activeItem = items.find((item) => item.active);
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
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: trigger + active page name */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          {activeItem && (
            <div className="flex items-center gap-2">
              {activeItem.icon && (
                <HugeiconsIcon
                  icon={activeItem.icon}
                  strokeWidth={2}
                  className="size-4 text-muted-foreground"
                />
              )}
              {activeItem.customIcon && (
                <activeItem.customIcon className="size-4 text-muted-foreground" />
              )}
              <h1 className="text-sm font-semibold text-foreground">
                {activeItem.label}
              </h1>
            </div>
          )}
        </div>

        {/* Right: breadcrumb nav + theme */}
        <div className="flex items-center gap-1.5">
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
