"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { HeartIcon } from "@/components/heart-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatWiringTemplateInventorySummary,
  parseWiringTemplateInventory,
} from "@/lib/wiring-template-inventory";
import type { WiringTemplateRow } from "@/lib/wiring-template-types";

type SavedSetupsContentProps = {
  templates: WiringTemplateRow[];
};

function isImageSource(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function getCreatorInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function formatCompactMetric(value: number) {
  if (value >= 1000) {
    const compact = value / 1000;
    const formatted = compact.toFixed(1);

    return `${formatted.replace(/\.0$/, "")}k`;
  }

  return String(value);
}

export function SavedSetupsContent({
  templates: initialTemplates,
}: SavedSetupsContentProps) {
  const router = useRouter();
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [query, setQuery] = React.useState("");
  const [pendingSaveId, setPendingSaveId] = React.useState<string | null>(null);
  const deferredQuery = React.useDeferredValue(query);

  const templatesWithInventory = React.useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        inventory: parseWiringTemplateInventory(
          template.diagramJson,
          template.switchLogicJson
        ),
      })),
    [templates]
  );

  const filteredTemplates = React.useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return templatesWithInventory.filter((template) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        template.name,
        template.description ?? "",
        template.pickupConfigurationName,
        template.switchTypeName,
        template.creatorName,
        formatWiringTemplateInventorySummary(template.inventory),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [deferredQuery, templatesWithInventory]);

  async function toggleTemplateSave(templateId: string) {
    setPendingSaveId(templateId);

    try {
      const response = await fetch(`/api/wiring-templates/${templateId}/save`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
            saved?: boolean;
            saveCount?: number;
            error?: string;
          }
        | undefined;

      if (response.status === 401) {
        router.push("/login?callbackUrl=/saved-setups");
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update save.");
      }

      setTemplates((current) =>
        current
          .map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  currentUserSaved: Boolean(payload?.saved),
                  saveCount: payload?.saveCount ?? template.saveCount,
                }
              : template
          )
          .filter((template) => template.currentUserSaved)
      );
    } finally {
      setPendingSaveId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
      <section className="rounded-[1.9rem] border border-border/70 bg-card/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Saved Setups
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Galeri wiring template yang kamu simpan dari halaman explore.
            </p>
          </div>
          <div className="w-full lg:w-[360px]">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari saved setup..."
                className="h-12 rounded-2xl border-border/70 bg-background/90 pl-10 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">
            {filteredTemplates.length} saved templates
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredTemplates.map((template) => {
          const inventorySummary = formatWiringTemplateInventorySummary(template.inventory);

          return (
            <div
              key={template.id}
              className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-background transition hover:-translate-y-0.5 hover:border-primary/35 dark:bg-card"
            >
              <Link href={`/explore/${template.id}`} className="block">
                <div className="relative h-72 bg-white">
                  {template.thumbnailUrl ? (
                    <Image
                      src={template.thumbnailUrl}
                      alt={template.name}
                      fill
                      unoptimized
                      className="object-contain object-center"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: template.isVerified
                            ? "linear-gradient(135deg, rgba(6,78,59,0.95), rgba(13,148,136,0.80))"
                            : "linear-gradient(135deg, rgba(88,28,135,0.92), rgba(244,114,182,0.75))",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white/90">
                        <div>
                          <div className="text-sm font-medium">Preview belum tersedia</div>
                          <div className="mt-2 text-xs text-white/75">
                            Template ini belum punya thumbnail.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/40 to-transparent p-5 text-white">
                    <div className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight">
                      {template.name}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm text-white/80">
                      {template.description || inventorySummary || "Saved wiring template."}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 text-sm">
                <div className="min-w-0">
                  <Link
                    href={template.creatorId ? `/explore/creator/${template.creatorId}` : "#"}
                    className={cn(
                      "flex min-w-0 items-center gap-3",
                      template.creatorId
                        ? "transition hover:text-primary"
                        : "pointer-events-none"
                    )}
                    aria-disabled={template.creatorId ? undefined : true}
                    tabIndex={template.creatorId ? undefined : -1}
                  >
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground">
                      {isImageSource(template.creatorPhoto) ? (
                        <Image
                          src={template.creatorPhoto!}
                          alt={template.creatorName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        getCreatorInitials(template.creatorName)
                      )}
                    </div>
                    <div className="min-w-0 truncate font-medium text-foreground">
                      {template.creatorName}
                    </div>
                  </Link>
                </div>

                <div className="flex shrink-0 items-center gap-4 text-muted-foreground">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-amber-500 transition hover:text-amber-500"
                    disabled={pendingSaveId === template.id}
                    onClick={() => {
                      void toggleTemplateSave(template.id);
                    }}
                    aria-label="Remove from saved setups"
                  >
                    <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} className="size-4" />
                    <span className="text-base font-medium text-foreground">
                      {formatCompactMetric(template.saveCount)}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <HeartIcon filled={template.currentUserLoved} className="size-4 text-rose-500" />
                    <span className="text-base font-medium text-foreground">
                      {formatCompactMetric(template.loveCount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                    <span className="text-base font-medium text-foreground">
                      {formatCompactMetric(template.viewCount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {filteredTemplates.length === 0 ? (
        <Card className="rounded-[1.8rem] border border-dashed border-border/80 bg-card/80 py-10">
          <CardContent className="text-center">
            <div className="text-base font-medium text-foreground">
              Belum ada setup yang disimpan
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Simpan wiring dari halaman explore, lalu galeri yang kamu bookmark akan muncul di sini.
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
