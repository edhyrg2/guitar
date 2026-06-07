"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  DashboardSquare01Icon,
  PaintBrush02Icon,
  Search01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { HeartIcon } from "@/components/heart-icon";
import { TopNavbar } from "@/components/top-navbar";
import { Card, CardContent } from "@/components/ui/card";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatWiringTemplateInventorySummary,
  parseWiringTemplateInventory,
} from "@/lib/wiring-template-inventory";
import type { WiringTemplateRow } from "@/lib/wiring-template-types";

type ExploreWiringTemplatesContentProps = {
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
    const formatted =
      compact >= 10 ? compact.toFixed(1) : compact.toFixed(1);

    return `${formatted.replace(/\.0$/, "")}k`;
  }

  return String(value);
}

export function ExploreWiringTemplatesContent({
  templates: initialTemplates,
}: ExploreWiringTemplatesContentProps) {
  const router = useRouter();
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [pendingLoveId, setPendingLoveId] = React.useState<string | null>(null);
  const [animatingLoveId, setAnimatingLoveId] = React.useState<string | null>(null);
  const [pendingSaveId, setPendingSaveId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [pickupFilter, setPickupFilter] = React.useState("all");
  const [switchFilter, setSwitchFilter] = React.useState("all");
  const [verificationFilter, setVerificationFilter] = React.useState("all");
  const deferredQuery = React.useDeferredValue(query);

  const pickupOptions = React.useMemo(
    () =>
      Array.from(
        new Map(
          templates.map((template) => [
            template.pickupConfigurationId,
            template.pickupConfigurationName,
          ])
        )
      ).sort((left, right) => left[1].localeCompare(right[1])),
    [templates]
  );

  const switchOptions = React.useMemo(
    () =>
      Array.from(
        new Map(
          templates.map((template) => [template.switchTypeId, template.switchTypeName])
        )
      ).sort((left, right) => left[1].localeCompare(right[1])),
    [templates]
  );

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
      const inventorySummary = formatWiringTemplateInventorySummary(template.inventory);
      const haystack = [
        template.name,
        template.slug,
        template.description,
        template.pickupConfigurationName,
        template.switchTypeName,
        template.difficultyLevel,
        template.sourceType,
        template.createdBy,
        template.isVerified ? "verified" : "published",
        inventorySummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesPickup =
        pickupFilter === "all" || template.pickupConfigurationId === pickupFilter;
      const matchesSwitch =
        switchFilter === "all" || template.switchTypeId === switchFilter;
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && template.isVerified) ||
        (verificationFilter === "published" && !template.isVerified);

      return matchesQuery && matchesPickup && matchesSwitch && matchesVerification;
    });
  }, [deferredQuery, pickupFilter, switchFilter, templatesWithInventory, verificationFilter]);

  async function toggleTemplateLove(templateId: string) {
    setPendingLoveId(templateId);
    setAnimatingLoveId(templateId);
    window.setTimeout(() => {
      setAnimatingLoveId((current) => (current === templateId ? null : current));
    }, 220);

    try {
      const response = await fetch(`/api/wiring-templates/${templateId}/love`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
            loved?: boolean;
            loveCount?: number;
            error?: string;
          }
        | undefined;

      if (response.status === 401) {
        router.push("/login?callbackUrl=/explore");
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update love.");
      }

      setTemplates((current) =>
        current.map((template) =>
          template.id === templateId
            ? {
                ...template,
                currentUserLoved: Boolean(payload?.loved),
                loveCount: payload?.loveCount ?? template.loveCount,
              }
            : template
        )
      );
    } finally {
      setPendingLoveId(null);
    }
  }

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
        router.push("/login?callbackUrl=/explore");
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update save.");
      }

      setTemplates((current) =>
        current.map((template) =>
          template.id === templateId
            ? {
                ...template,
                currentUserSaved: Boolean(payload?.saved),
                saveCount: payload?.saveCount ?? template.saveCount,
              }
            : template
        )
      );
    } finally {
      setPendingSaveId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        searchPlaceholder="Search published wiring, configuration, switch..."
        items={[
          { label: "Overview", href: "/dashboard", icon: DashboardSquare01Icon },
          { label: "Wiring Library", href: "/explore", icon: ViewIcon, active: true },
          { label: "Custom Builder", href: "/custom-builder", icon: PaintBrush02Icon },
          { label: "Users", href: "/users", icon: UserAccountIcon },
        ]}
      />

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        <section className="rounded-[1.9rem] border border-border/70 bg-card/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))]">
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Search
              </span>
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={2}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search template, creator, source..."
                  className="h-12 rounded-2xl border-border/70 bg-background/90 pl-10 shadow-sm"
                />
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pickup
              </span>
              <AppSelect
                value={pickupFilter}
                onValueChange={setPickupFilter}
                className="h-12 rounded-2xl bg-background/90 px-3 text-sm"
                options={[
                  { value: "all", label: "All pickups" },
                  ...pickupOptions.map(([id, name]) => ({
                    value: id,
                    label: name,
                  })),
                ]}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Switch
              </span>
              <AppSelect
                value={switchFilter}
                onValueChange={setSwitchFilter}
                className="h-12 rounded-2xl bg-background/90 px-3 text-sm"
                options={[
                  { value: "all", label: "All switches" },
                  ...switchOptions.map(([id, name]) => ({
                    value: id,
                    label: name,
                  })),
                ]}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </span>
              <AppSelect
                value={verificationFilter}
                onValueChange={setVerificationFilter}
                className="h-12 rounded-2xl bg-background/90 px-3 text-sm"
                options={[
                  { value: "all", label: "All published" },
                  { value: "verified", label: "Verified only" },
                  { value: "published", label: "Published only" },
                ]}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Results
            </span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">
              {filteredTemplates.length} templates
            </span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
              {pickupFilter === "all"
                ? "All pickups"
                : pickupOptions.find(([id]) => id === pickupFilter)?.[1] ?? pickupFilter}
            </span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
              {switchFilter === "all"
                ? "All switches"
                : switchOptions.find(([id]) => id === switchFilter)?.[1] ?? switchFilter}
            </span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
              {verificationFilter === "all"
                ? "All published"
                : verificationFilter === "verified"
                  ? "Verified only"
                  : "Published only"}
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
                          <div className="text-sm font-medium">Preview not available</div>
                          <div className="mt-2 text-xs text-white/75">
                            This template has been published but does not have a thumbnail yet.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/40 to-transparent p-5 text-white">
                    <div className="min-w-0 pb-0.5">
                      <div className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight">
                        {template.name}
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm text-white/80">
                        {template.description ||
                          inventorySummary ||
                          "Published wiring template."}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/75">
                        <span>{template.switchTypeName}</span>
                        <span>
                          {template.volumeCount} Vol / {template.toneCount} Tone
                        </span>
                        <span>{template.difficultyLevel ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </Link>

                <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={
                        template.creatorId
                          ? `/explore/creator/${template.creatorId}`
                          : "#"
                      }
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
                      className={cn(
                        "flex items-center gap-1.5 transition hover:text-amber-500",
                        template.currentUserSaved
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      )}
                      disabled={pendingSaveId === template.id}
                      onClick={() => {
                        void toggleTemplateSave(template.id);
                      }}
                      aria-label={
                        template.currentUserSaved
                          ? "Remove from saved setups"
                          : "Save setup"
                      }
                    >
                      <HugeiconsIcon
                        icon={Bookmark02Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                      <span className="text-base font-medium text-foreground">
                        {formatCompactMetric(template.saveCount)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1.5 transition hover:text-rose-500",
                        template.currentUserLoved
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      )}
                      disabled={pendingLoveId === template.id}
                      onClick={() => {
                        void toggleTemplateLove(template.id);
                      }}
                      aria-label={
                        template.currentUserLoved
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <HeartIcon
                        filled={template.currentUserLoved || animatingLoveId === template.id}
                        className={cn(
                          "size-4 transition-transform duration-200 ease-out",
                          animatingLoveId === template.id ? "scale-125" : "scale-100"
                        )}
                      />
                      <span className="text-base font-medium text-foreground">
                        {formatCompactMetric(template.loveCount)}
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={ViewIcon}
                        strokeWidth={2}
                        className="size-4"
                      />
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
                No matching published wiring found
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Try changing your search keywords or loosening the pickup, switch, or status filters.
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
