"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpCircleIcon,
  ViewIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { AuthUserControl } from "@/components/auth-user-control";
import { GuitarIcon } from "@/components/guitar-icon";
import { ThemeControls } from "@/components/theme-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Gallery", href: "/", icon: ViewIcon, active: true },
  { label: "Wiring Builder", href: "/custom-builder", icon: Wrench01Icon },
  { label: "Help", href: "/help", icon: HelpCircleIcon },
];

const authNavItems = [
  { label: "Wiring Library", href: "/explore", icon: ViewIcon },
];

export function PublicGalleryNavbar() {
  const { data: session } = useSession();
  const levelLabelMap = {
    USER: "User",
    DEVELOPER: "Developer",
    MASTER: "Master",
  } as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition hover:opacity-80"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GuitarIcon className="size-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">
                Guitar Wiring
              </div>
              <div className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Community
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "h-9 gap-1.5 text-sm",
                  item.active && "bg-secondary/80 font-medium"
                )}
              >
                <Link href={item.href}>
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  {item.label}
                </Link>
              </Button>
            ))}
            {session?.user &&
              authNavItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 text-sm"
                >
                  <Link href={item.href}>
                    <HugeiconsIcon
                      icon={item.icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                    {item.label}
                  </Link>
                </Button>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeControls compact />
          {session?.user ? (
            <AuthUserControl
              variant="navbar"
              name={session.user.name ?? session.user.email ?? "User"}
              level={
                levelLabelMap[
                  session.user.level as keyof typeof levelLabelMap
                ] ?? "User"
              }
              photo={session.user.photo}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
