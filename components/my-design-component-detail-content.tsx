"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  PaintBrush02Icon,
  Rocket01Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { TopNavbar } from "@/components/top-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MyDesignComponentDetailContentProps = {
  item: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    status: string;
    publishedTemplateName: string | null;
    createdAt: string;
    updatedAt: string;
    isPublished: boolean;
  };
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function MyDesignComponentDetailContent({
  item,
}: MyDesignComponentDetailContentProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = React.useState(item.isPublished);
  const [isPending, setIsPending] = React.useState(false);

  async function handleUnpublish() {
    setIsPending(true);
    try {
      const response = await fetch(`/api/custom-component-drafts/${item.id}/unpublish`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error || "Failed to unpublish.");
      }
      setIsPublished(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        items={[
          { label: "My Designs", href: "/my-design", icon: PaintBrush02Icon },
          {
            label: "Component Detail",
            href: `/my-design/component/${item.id}`,
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
                <Button variant="ghost" size="sm" className="mb-2 -ml-3 gap-2.5 px-3" asChild>
                  <Link href="/my-design">
                    <span className="flex size-7 items-center justify-center rounded-full border border-border/70 bg-muted/50">
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    </span>
                    Back to My Designs
                  </Link>
                </Button>
                <CardTitle className="text-2xl sm:text-4xl">{item.title}</CardTitle>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{isPublished ? "Published" : item.status}</span>
                  {item.publishedTemplateName ? <span>• {item.publishedTemplateName}</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isPublished ? (
                  <Button
                    size="lg"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => void handleUnpublish()}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
                    {isPending ? "Processing..." : "Unpublish"}
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" disabled>
                    <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} data-icon="inline-start" />
                    Not Published
                  </Button>
                )}
                <Button size="lg" asChild>
                  <Link href={`/custom-component?draftId=${item.id}`}>
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" />
                    Open Editor
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-white">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-contain object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(88,28,135,0.92),rgba(244,114,182,0.75))]" />
              )}
            </div>

            <div className="space-y-4">
              <Card className="border border-border/70 bg-background/80 py-0 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Description
                    </div>
                    <div className="mt-2 text-sm leading-6 text-foreground">
                      {item.description || "No description provided for this component draft."}
                    </div>
                  </div>
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
