"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  FavouriteIcon,
  PaintBrush02Icon,
  Search01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { StatCard } from "@/components/stat-card";
import { TopNavbar } from "@/components/top-navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatWiringTemplateInventorySummary,
  parseWiringTemplateInventory,
} from "@/lib/wiring-template-inventory";
import type { WiringTemplateRow } from "@/lib/wiring-template-types";

type ExploreWiringTemplatesContentProps = {
  templates: WiringTemplateRow[];
};

function formatTemplateDate(value: string) {
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

function getTemplateAccent(template: WiringTemplateRow) {
  if (template.isVerified) {
    return {
      badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
      glow: "from-emerald-300/30 via-teal-200/20 to-sky-200/10",
      dot: "bg-emerald-500",
    };
  }

  return {
    badge: "border-amber-200/80 bg-amber-50 text-amber-700",
    glow: "from-amber-300/30 via-orange-200/20 to-rose-200/10",
    dot: "bg-amber-500",
  };
}

export function ExploreWiringTemplatesContent({
  templates,
}: ExploreWiringTemplatesContentProps) {
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

  const stats = [
    {
      title: "Published Wiring",
      value: String(templates.length),
      change: `${filteredTemplates.length} shown`,
      detail: "templates ready to browse",
      icon: ViewIcon,
    },
    {
      title: "Verified Templates",
      value: String(templates.filter((item) => item.isVerified).length),
      change: "factory or reviewed references",
      detail: "trusted wiring diagrams",
      icon: FavouriteIcon,
    },
    {
      title: "Pickup Layouts",
      value: String(new Set(templates.map((item) => item.pickupConfigurationId)).size),
      change: "configurations available",
      detail: "from single coil to humbucker",
      icon: ElectricPlugsIcon,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        searchPlaceholder="Search published wiring, configuration, switch..."
        items={[
          { label: "Overview", href: "/", icon: DashboardSquare01Icon },
          { label: "Explore", href: "/explore", icon: ViewIcon, active: true },
          { label: "Custom Builder", href: "/custom-builder", icon: PaintBrush02Icon },
          { label: "Users", href: "/users", icon: UserAccountIcon },
        ]}
      />

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.94))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/6 blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-end">
            <div className="grid gap-4">
              <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Wiring Gallery
              </span>
              <div className="grid gap-3">
                <h1 className="max-w-3xl font-heading text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
                  Explore published guitar wiring templates in a showcase layout.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Browse verified and published diagrams, compare pickup layouts, then open a
                  dedicated detail page for an overview-style reading experience.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-border/70 bg-background/80 p-4 shadow-sm sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={`${stat.title}-hero`}
                  className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-4"
                >
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.title}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</div>
                  <div className="mt-2 text-xs font-medium text-foreground">{stat.change}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>

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
              <select
                value={pickupFilter}
                onChange={(event) => setPickupFilter(event.target.value)}
                className="h-12 rounded-2xl border border-input bg-background/90 px-3 text-sm outline-none"
              >
                <option value="all">All pickups</option>
                {pickupOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Switch
              </span>
              <select
                value={switchFilter}
                onChange={(event) => setSwitchFilter(event.target.value)}
                className="h-12 rounded-2xl border border-input bg-background/90 px-3 text-sm outline-none"
              >
                <option value="all">All switches</option>
                {switchOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </span>
              <select
                value={verificationFilter}
                onChange={(event) => setVerificationFilter(event.target.value)}
                className="h-12 rounded-2xl border border-input bg-background/90 px-3 text-sm outline-none"
              >
                <option value="all">All published</option>
                <option value="verified">Verified only</option>
                <option value="published">Published only</option>
              </select>
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
                ? "All statuses"
                : verificationFilter === "verified"
                  ? "Verified only"
                  : "Published only"}
            </span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const accent = getTemplateAccent(template);

            return (
              <Card
                key={template.id}
                className="group overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_22px_60px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1"
              >
                <Link href={`/explore/${template.id}`} className="block">
                  <div className={`relative overflow-hidden border-b border-border/60 bg-gradient-to-br ${accent.glow}`}>
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${accent.badge}`}
                      >
                        {template.isVerified ? "Verified" : "Published"}
                      </span>
                      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1 text-[0.68rem] text-muted-foreground">
                        <span className={`size-2 rounded-full ${accent.dot}`} />
                        {template.sourceType ?? "Wiring Template"}
                      </div>
                    </div>

                    <div className="flex aspect-[16/10] items-center justify-center p-5 pt-16">
                      {template.thumbnailUrl ? (
                        <Image
                          src={template.thumbnailUrl}
                          alt={template.name}
                          width={1200}
                          height={750}
                          unoptimized
                          className="max-h-full w-full rounded-[1.4rem] border border-white/80 bg-white object-contain shadow-[0_18px_35px_rgba(15,23,42,0.10)]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-border/80 bg-white/70 px-6 text-center">
                          <HugeiconsIcon
                            icon={ViewIcon}
                            strokeWidth={1.8}
                            className="mb-3 text-muted-foreground"
                          />
                          <div className="text-sm font-medium text-foreground">
                            Thumbnail belum tersedia
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Template ini sudah publish, tapi belum punya preview image.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <CardHeader className="gap-3 px-5 pt-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {template.pickupConfigurationName}
                      </span>
                      <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {template.switchTypeName}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {template.description || "Template publish tanpa deskripsi tambahan."}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-4 px-5">
                    <div className="grid gap-3 rounded-[1.4rem] border border-border/60 bg-muted/20 p-4">
                      <div className="grid gap-1">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Inventory
                        </span>
                        <span className="line-clamp-3 text-sm font-medium leading-6 text-foreground">
                          {formatWiringTemplateInventorySummary(template.inventory) || "-"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-background/80 p-3">
                          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Controls
                          </div>
                          <div className="mt-1 font-medium text-foreground">
                            {template.volumeCount} Vol / {template.toneCount} Tone
                          </div>
                        </div>
                        <div className="rounded-2xl bg-background/80 p-3">
                          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Difficulty
                          </div>
                          <div className="mt-1 font-medium text-foreground">
                            {template.difficultyLevel ?? "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Creator
                        </div>
                        <div className="truncate font-medium text-foreground">
                          {template.createdBy}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Published
                        </div>
                        <div className="font-medium text-foreground">
                          {formatTemplateDate(template.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="items-center justify-between gap-3 border-t border-border/60 px-5 pt-4">
                    <div className="min-w-0">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Slug
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {template.slug ?? "no-slug"}
                      </div>
                    </div>
                    <div className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                      Open detail page
                    </div>
                  </CardFooter>
                </Link>
              </Card>
            );
          })}
        </section>

        {filteredTemplates.length === 0 ? (
          <Card className="rounded-[1.8rem] border border-dashed border-border/80 bg-card/80 py-10">
            <CardContent className="text-center">
              <div className="text-base font-medium text-foreground">
                Tidak ada wiring publish yang cocok
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Coba ubah kata kunci pencarian atau longgarkan filter pickup, switch, atau status.
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
