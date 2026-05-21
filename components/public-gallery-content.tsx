"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  CheckmarkBadge01Icon,
  FilterIcon,
  Search01Icon,
  SortingDownIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { HeartIcon } from "@/components/heart-icon";
import { GuitarIcon } from "@/components/guitar-icon";
import { cn } from "@/lib/utils";
import {
  formatWiringTemplateInventorySummary,
  parseWiringTemplateInventory,
} from "@/lib/wiring-template-inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WiringTemplateRow } from "@/lib/wiring-template-types";

type PublicGalleryContentProps = {
  templates: WiringTemplateRow[];
};

type SortMode = "popular" | "newest" | "most-loved" | "most-saved";
type QuickFilter = "all" | "verified" | "popular" | "newest";

function isImageSource(value: string | null | undefined) {
  if (!value) return false;
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
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

function getGradientForIndex(index: number) {
  const gradients = [
    "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)",
    "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)",
    "linear-gradient(135deg, #172554 0%, #2563eb 100%)",
    "linear-gradient(135deg, #4a0404 0%, #dc2626 100%)",
    "linear-gradient(135deg, #3b0764 0%, #a855f7 100%)",
    "linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)",
  ];
  return gradients[index % gradients.length];
}

export function PublicGalleryContent({
  templates: initialTemplates,
}: PublicGalleryContentProps) {
  const router = useRouter();
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [pendingLoveId, setPendingLoveId] = React.useState<string | null>(null);
  const [animatingLoveId, setAnimatingLoveId] = React.useState<string | null>(null);
  const [pendingSaveId, setPendingSaveId] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState("");
  const [quickFilter, setQuickFilter] = React.useState<QuickFilter>("all");
  const [sortMode, setSortMode] = React.useState<SortMode>("popular");
  const [pickupFilter, setPickupFilter] = React.useState("all");
  const [switchFilter, setSwitchFilter] = React.useState("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const deferredQuery = React.useDeferredValue(query);

  const pickupOptions = React.useMemo(
    () =>
      Array.from(
        new Map(
          templates.map((t) => [t.pickupConfigurationId, t.pickupConfigurationName])
        )
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [templates]
  );

  const switchOptions = React.useMemo(
    () =>
      Array.from(
        new Map(templates.map((t) => [t.switchTypeId, t.switchTypeName]))
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [templates]
  );

  const templatesWithInventory = React.useMemo(
    () =>
      templates.map((t) => ({
        ...t,
        inventory: parseWiringTemplateInventory(t.diagramJson, t.switchLogicJson),
      })),
    [templates]
  );


  const filteredTemplates = React.useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    let result = templatesWithInventory.filter((t) => {
      const summary = formatWiringTemplateInventorySummary(t.inventory);
      const haystack = [
        t.name, t.slug, t.description, t.pickupConfigurationName,
        t.switchTypeName, t.difficultyLevel, t.sourceType, t.createdBy,
        t.isVerified ? "verified" : "published", summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);
      const matchesPickup = pickupFilter === "all" || t.pickupConfigurationId === pickupFilter;
      const matchesSwitch = switchFilter === "all" || t.switchTypeId === switchFilter;
      const matchesQuick = quickFilter !== "verified" || t.isVerified;

      return matchesQuery && matchesPickup && matchesSwitch && matchesQuick;
    });

    switch (sortMode) {
      case "popular":
        result.sort((a, b) => b.viewCount + b.loveCount * 10 - (a.viewCount + a.loveCount * 10));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "most-loved":
        result.sort((a, b) => b.loveCount - a.loveCount);
        break;
      case "most-saved":
        result.sort((a, b) => b.saveCount - a.saveCount);
        break;
    }

    if (quickFilter === "popular") result = result.slice(0, 20);
    if (quickFilter === "newest") {
      result = [...result]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
    }

    return result;
  }, [deferredQuery, pickupFilter, switchFilter, quickFilter, sortMode, templatesWithInventory]);

  async function toggleTemplateLove(templateId: string) {
    setPendingLoveId(templateId);
    setAnimatingLoveId(templateId);
    window.setTimeout(() => {
      setAnimatingLoveId((cur) => (cur === templateId ? null : cur));
    }, 220);

    try {
      const res = await fetch(`/api/wiring-templates/${templateId}/love`, { method: "POST" });
      const data = (await res.json()) as { loved?: boolean; loveCount?: number; error?: string } | undefined;

      if (res.status === 401) { router.push("/login?callbackUrl=/"); return; }
      if (!res.ok) throw new Error(data?.error || "Failed to update love.");

      setTemplates((cur) =>
        cur.map((t) =>
          t.id === templateId
            ? { ...t, currentUserLoved: Boolean(data?.loved), loveCount: data?.loveCount ?? t.loveCount }
            : t
        )
      );
    } finally {
      setPendingLoveId(null);
    }
  }

  async function toggleTemplateSave(templateId: string) {
    setPendingSaveId(templateId);

    try {
      const res = await fetch(`/api/wiring-templates/${templateId}/save`, { method: "POST" });
      const data = (await res.json()) as { saved?: boolean; saveCount?: number; error?: string } | undefined;

      if (res.status === 401) { router.push("/login?callbackUrl=/"); return; }
      if (!res.ok) throw new Error(data?.error || "Failed to update save.");

      setTemplates((cur) =>
        cur.map((t) =>
          t.id === templateId
            ? { ...t, currentUserSaved: Boolean(data?.saved), saveCount: data?.saveCount ?? t.saveCount }
            : t
        )
      );
    } finally {
      setPendingSaveId(null);
    }
  }

  const activeFilterCount = (pickupFilter !== "all" ? 1 : 0) + (switchFilter !== "all" ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,116,144,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(99,102,241,0.08),transparent_50%)]" />

        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <GuitarIcon className="size-4" />
            Community Wiring Gallery
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Discover Guitar{" "}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-300">
              Wiring Diagrams
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Explore, save, and build professional wiring setups shared by the community.
          </p>

          {/* Search */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search diagrams, pickups, switches..."
                className="h-12 w-full rounded-xl border border-border/70 bg-card/90 pl-11 pr-4 text-sm outline-none ring-2 ring-transparent transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Quick filters */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(
              [
                { key: "all", label: "All" },
                { key: "verified", label: "✓ Verified" },
                { key: "popular", label: "🔥 Popular" },
                { key: "newest", label: "✨ Newest" },
              ] as { key: QuickFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setQuickFilter(f.key)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                  quickFilter === f.key
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* ── Sort / Filter bar ─────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {filteredTemplates.length} diagrams
            </span>
            <div className="h-3.5 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={SortingDownIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="h-7 border-none bg-transparent px-1 text-xs font-medium shadow-none focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="most-loved">Most Loved</SelectItem>
                  <SelectItem value="most-saved">Most Saved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              showFilters
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[0.55rem] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-border/40 bg-card/95 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Pickup
                </span>
                <Select value={pickupFilter} onValueChange={setPickupFilter}>
                  <SelectTrigger className="h-7 min-w-36 text-xs">
                    <SelectValue placeholder="All pickups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All pickups</SelectItem>
                    {pickupOptions.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Switch
                </span>
                <Select value={switchFilter} onValueChange={setSwitchFilter}>
                  <SelectTrigger className="h-7 min-w-36 text-xs">
                    <SelectValue placeholder="All switches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All switches</SelectItem>
                    {switchOptions.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setPickupFilter("all"); setSwitchFilter("all"); }}
                  className="h-7 self-end text-xs font-medium text-primary transition hover:text-primary/80"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Gallery grid ─────────────────────────────────────── */}
      <section className="flex-1">
        {filteredTemplates.length === 0 ? (
          <div className="mx-auto mt-16 max-w-sm px-4 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
              <GuitarIcon className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No diagrams found</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Try adjusting your search or filters.
            </p>
            <button
              type="button"
              onClick={() => { setQuery(""); setQuickFilter("all"); setPickupFilter("all"); setSwitchFilter("all"); }}
              className="mt-3 text-xs font-medium text-primary transition hover:text-primary/80"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredTemplates.map((t, i) => {
              const summary = formatWiringTemplateInventorySummary(t.inventory);
              return (
                <div key={t.id} className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                  {/* Image */}
                  <Link
                    href={`/preview/${t.id}`}
                    className="relative block aspect-[4/3] overflow-hidden bg-white dark:bg-neutral-100"
                  >
                    {t.thumbnailUrl ? (
                      <Image
                        src={t.thumbnailUrl}
                        alt={t.name}
                        fill
                        unoptimized
                        className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: getGradientForIndex(i) }}
                      >
                        <GuitarIcon className="size-12 text-white/20" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/50 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex flex-wrap gap-1">
                        {t.isVerified && (
                          <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[0.6rem] font-semibold text-white">
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2.5} className="size-2.5" />
                            Verified
                          </span>
                        )}
                        <span className="rounded-full bg-black/50 px-2 py-0.5 text-[0.6rem] font-medium text-white">
                          {t.pickupConfigurationName}
                        </span>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full transition",
                            t.currentUserSaved ? "bg-amber-500 text-white" : "bg-white/90 text-neutral-700 hover:bg-white"
                          )}
                          disabled={pendingSaveId === t.id}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggleTemplateSave(t.id); }}
                          aria-label={t.currentUserSaved ? "Remove from saved" : "Save"}
                        >
                          <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full transition",
                            t.currentUserLoved ? "bg-rose-500 text-white" : "bg-white/90 text-neutral-700 hover:bg-white"
                          )}
                          disabled={pendingLoveId === t.id}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggleTemplateLove(t.id); }}
                          aria-label={t.currentUserLoved ? "Unlike" : "Like"}
                        >
                          <HeartIcon
                            filled={t.currentUserLoved || animatingLoveId === t.id}
                            className={cn(
                              "size-3.5 transition-transform duration-200",
                              animatingLoveId === t.id ? "scale-125" : "scale-100"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </Link>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <Link
                      href={t.creatorId ? `/explore/creator/${t.creatorId}` : "#"}
                      className={cn(
                        "flex min-w-0 items-center gap-2",
                        t.creatorId ? "transition hover:opacity-80" : "pointer-events-none"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[0.55rem] font-semibold text-foreground">
                        {isImageSource(t.creatorPhoto) ? (
                          <Image src={t.creatorPhoto!} alt={t.creatorName} fill unoptimized className="object-cover" />
                        ) : (
                          getCreatorInitials(t.creatorName)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium leading-tight text-foreground">{t.name}</p>
                        <p className="truncate text-[0.68rem] leading-tight text-muted-foreground">{t.creatorName}</p>
                      </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2 pl-2 text-[0.7rem] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <HeartIcon
                          filled={t.currentUserLoved}
                          className={cn("size-3", t.currentUserLoved && "text-rose-500")}
                        />
                        {formatCompactMetric(t.loveCount)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3" />
                        {formatCompactMetric(t.viewCount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/20 dark:bg-muted/5">
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <GuitarIcon className="size-3.5" />
            <span>Guitar Wiring Community</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="transition hover:text-foreground">Explore</Link>
            <Link href="/custom-builder" className="transition hover:text-foreground">Builder</Link>
            <Link href="/dashboard" className="transition hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
