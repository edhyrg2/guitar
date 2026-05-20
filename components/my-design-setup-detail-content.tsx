"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  PaintBrush02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { TopNavbar } from "@/components/top-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MyDesignSetupDetailContentProps = {
  item: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function MyDesignSetupDetailContent({
  item,
}: MyDesignSetupDetailContentProps) {
  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        searchPlaceholder="Browse setup detail and builder summary..."
        items={[
          { label: "Overview", href: "/", icon: DashboardSquare01Icon },
          { label: "Workspace", href: "/my-design", icon: PaintBrush02Icon },
          {
            label: "Setup Detail",
            href: `/my-design/setup/${item.id}`,
            icon: UserAccountIcon,
            active: true,
          },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="gap-4 border-b border-border/70 pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <Button variant="ghost" size="sm" className="mb-2 -ml-3 px-3" asChild>
                  <Link href="/my-design">
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Back to My Design
                  </Link>
                </Button>
                <CardTitle className="text-2xl sm:text-4xl">{item.title}</CardTitle>
                <div className="mt-3 text-sm text-muted-foreground">{item.status}</div>
              </div>

              <Button size="lg" asChild>
                <Link href={`/custom-builder?savedSetupId=${encodeURIComponent(item.id)}`}>
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Open Builder
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(8,145,178,0.80))] p-6 text-white">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
                Summary
              </div>
              <div className="mt-4 text-base leading-7 text-white/90">
                {item.description ||
                  "Setup ini belum dipublish sebagai template, jadi detail interaktifnya belum tersedia di halaman explore."}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border border-border/70 bg-background/80 py-0 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Created
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Updated
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {formatDate(item.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
