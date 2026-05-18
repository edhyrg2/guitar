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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  const filteredTemplates = React.useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return templates.filter((template) => {
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
  }, [deferredQuery, pickupFilter, switchFilter, templates, verificationFilter]);

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

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>

        <section className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-card/70 p-4 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))]">
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
                className="h-11 rounded-2xl pl-10"
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
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm outline-none"
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
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm outline-none"
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
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="all">All published</option>
              <option value="verified">Verified only</option>
              <option value="published">Published only</option>
            </select>
          </label>
        </section>

        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.12),transparent_55%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.92))]">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
                  <span className="rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {template.isVerified ? "Verified" : "Published"}
                  </span>
                  <span className="rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
                    {template.sourceType ?? "Wiring Template"}
                  </span>
                </div>
                <div className="flex aspect-[16/10] items-center justify-center p-5 pt-14">
                  {template.thumbnailUrl ? (
                    <Image
                      src={template.thumbnailUrl}
                      alt={template.name}
                      width={1200}
                      height={750}
                      unoptimized
                      className="max-h-full w-full rounded-2xl border border-border/70 bg-white object-contain shadow-sm"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-white/70 px-6 text-center">
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

              <CardHeader className="gap-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>
                  {template.pickupConfigurationName} • {template.switchTypeName}
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                {template.description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {template.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Template publish tanpa deskripsi tambahan.
                  </p>
                )}

                <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Controls</span>
                    <span className="font-medium text-foreground">
                      {template.volumeCount} Vol / {template.toneCount} Tone
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium text-foreground">
                      {template.difficultyLevel ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="truncate font-medium text-foreground">
                      {template.createdBy}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-medium text-foreground">
                      {formatTemplateDate(template.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-between border-t border-border/60 pt-4">
                <div className="min-w-0 text-xs text-muted-foreground">
                  <div className="truncate">{template.slug ?? "no-slug"}</div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/wiring/templates">Open Admin</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
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
