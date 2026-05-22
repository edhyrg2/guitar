"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpCircleIcon,
  Logout03Icon,
  UserAccountIcon,
  ViewIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";
import { ThemeControls } from "@/components/theme-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import * as React from "react";

const navItems = [
  { label: "Gallery", href: "/", icon: ViewIcon, active: true },
  { label: "Wiring Builder", href: "/custom-builder", icon: Wrench01Icon },
  { label: "Help", href: "/help", icon: HelpCircleIcon },
];

const authNavItems = [
  { label: "Wiring Library", href: "/explore", icon: ViewIcon },
];

function isImageSource(value: string | null | undefined) {
  if (!value) return false;
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function UserDropdown({
  name,
  photo,
  level,
}: {
  name: string;
  photo: string | null;
  level: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-xs font-semibold text-foreground transition hover:ring-2 hover:ring-primary/20"
      >
        {isImageSource(photo) ? (
          <Image src={photo!} alt={name} fill unoptimized className="object-cover" />
        ) : (
          getInitials(name)
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg animate-in fade-in slide-in-from-top-2">
          {/* User info */}
          <div className="border-b border-border/50 px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link
              href="/my-design"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <HugeiconsIcon icon={UserAccountIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
              Profile
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
            <UserDropdown
              name={session.user.name ?? session.user.email ?? "User"}
              photo={session.user.photo}
              level={
                levelLabelMap[
                  session.user.level as keyof typeof levelLabelMap
                ] ?? "User"
              }
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
