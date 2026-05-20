"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type AuthUserControlProps = {
  name: string;
  level: string;
  photo: string | null;
  variant?: "navbar" | "sidebar";
};

function isImageSource(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function AuthUserControl({
  name,
  level,
  photo,
  variant = "navbar",
}: AuthUserControlProps) {
  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3">
        <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-md bg-sidebar-accent font-medium text-sidebar-accent-foreground">
          {isImageSource(photo) ? (
            <Image
              src={photo!}
              alt={name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            photo ?? name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-sidebar-foreground/70">{level}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Logout"
          title="Logout"
        >
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "hidden items-center gap-2 rounded-md border border-border/70 bg-card px-2.5 py-1.5 sm:flex"
        )}
      >
        <div className="relative flex size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-accent font-medium text-sidebar-accent-foreground">
          {isImageSource(photo) ? (
            <Image
              src={photo!}
              alt={name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            photo ?? name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 text-left">
          <div className="truncate text-xs font-medium">{name}</div>
          <div className="truncate text-[0.65rem] text-muted-foreground">
            {level}
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <HugeiconsIcon
          icon={Logout03Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Logout
      </Button>
    </div>
  );
}
