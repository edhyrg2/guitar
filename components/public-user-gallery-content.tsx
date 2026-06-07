"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookBookmark01Icon,
  DashboardSquare01Icon,
  LinkSquare02Icon,
  Location01Icon,
  PaintBrush02Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { TopNavbar } from "@/components/top-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MyDesignItem, MyDesignStats } from "@/lib/my-design-types";

type PublicUserGalleryProfile = {
  id: string;
  name: string;
  level: "USER" | "DEVELOPER" | "MASTER";
  photo: string | null;
  profileBio: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  isBuilder: boolean;
  builderWorkshopName: string | null;
  builderBio: string | null;
  builderSpecialty: string | null;
  builderExperienceYears: number | null;
  builderPortfolioUrl: string | null;
  builderShopUrl: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
};

type PublicUserGalleryContentProps = {
  profile: PublicUserGalleryProfile;
  stats: MyDesignStats;
  items: MyDesignItem[];
  hideNavbar?: boolean;
};

type PublishedFilter = "all" | "saved-setup" | "component-draft";

function isImageSource(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.startsWith("/") || /^(https?:\/\/|blob:|data:)/i.test(value);
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function getLinkHref(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "#";
  }

  return /^[a-z][a-z\d+\-.]*:/i.test(normalized)
    ? normalized
    : `https://${normalized}`;
}

export function PublicUserGalleryContent({
  profile,
  stats,
  items,
  hideNavbar = false,
}: PublicUserGalleryContentProps) {
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<PublishedFilter>("all");
  const deferredQuery = React.useDeferredValue(query);

  const socialLinks = [
    { label: "Website", value: profile.websiteUrl },
    { label: "Portfolio", value: profile.builderPortfolioUrl },
    { label: "Shop", value: profile.builderShopUrl },
    { label: "Facebook", value: profile.facebookUrl },
    { label: "Instagram", value: profile.instagramUrl },
    { label: "YouTube", value: profile.youtubeUrl },
    { label: "X / Twitter", value: profile.xUrl },
  ].filter((item) => item.value);

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (activeFilter !== "all" && item.type !== activeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        item.title,
        item.description ?? "",
        item.status,
        item.publishedTemplateName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, deferredQuery, items]);

  return (
    <div className="flex flex-1 flex-col">
      {!hideNavbar && (
        <TopNavbar
          searchPlaceholder="Search creator profile and published gallery..."
          items={[
            { label: "Overview", href: "/dashboard", icon: DashboardSquare01Icon },
            { label: "Explore", href: "/explore", icon: ViewIcon },
            {
              label: "Creator Gallery",
              href: `/explore/creator/${profile.id}`,
              icon: UserAccountIcon,
              active: true,
            },
            { label: "My Design", href: "/my-design", icon: PaintBrush02Icon },
          ]}
        />
      )}

      <div className="flex flex-1 flex-col gap-6 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(241,245,249,0.72))] px-4 py-6 text-foreground dark:bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(23,23,23,0.98))] sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:bg-background/90 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="relative border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(135deg,rgba(18,18,18,0.98),rgba(28,28,28,0.96))] sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative flex h-44 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-3xl font-semibold tracking-tight text-white shadow-lg dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)] sm:h-48 sm:w-40">
                  {isImageSource(profile.photo) ? (
                    <Image
                      src={profile.photo!}
                      alt={profile.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    getInitials(profile.name)
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                        {profile.name}
                      </h1>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                        {profile.level}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {profile.location ? (
                        <span className="inline-flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Location01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                          {profile.location}
                        </span>
                      ) : null}
                      <span>{stats.totalDesigns} published items</span>
                    </div>
                  </div>

                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {profile.profileBio || "Creator ini belum menambahkan deskripsi publik."}
                  </p>

                  {profile.isBuilder ? (
                    <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground dark:bg-background/40">
                      <div className="font-medium text-foreground">
                        {profile.builderWorkshopName || "Guitar Builder"}
                      </div>
                      {profile.builderSpecialty ? <div>{profile.builderSpecialty}</div> : null}
                      {profile.builderExperienceYears !== null ? (
                        <div>{profile.builderExperienceYears} years of builder experience</div>
                      ) : null}
                      {profile.builderBio ? <div>{profile.builderBio}</div> : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {socialLinks.length > 0 ? (
                      socialLinks.map((item) => (
                        <a
                          key={item.label}
                          href={getLinkHref(item.value ?? "")}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5 dark:bg-background/60"
                        >
                          <HugeiconsIcon
                            icon={LinkSquare02Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                          {item.label}
                        </a>
                      ))
                    ) : (
                      <div className="rounded-full border border-dashed border-border/70 bg-background/40 px-3 py-1.5 text-sm text-muted-foreground dark:bg-background/20">
                        Belum ada social link publik
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:w-[420px]">
                {[
                  { label: "Total Published", value: String(stats.totalDesigns) },
                  { label: "Published Setups", value: String(stats.publishedSetups) },
                  { label: "Components", value: String(stats.componentDrafts) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 dark:bg-card"
                  >
                    <div className="text-2xl font-semibold text-foreground">{item.value}</div>
                    <div className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <Card className="border border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl">Published Gallery</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Semua karya publik dari creator ini.
                </p>
              </div>
              <div className="w-full sm:w-[320px]">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari template atau komponen publish..."
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All Published" },
                  { key: "saved-setup", label: "Published Setups" },
                  { key: "component-draft", label: "Published Components" },
                ].map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    variant={activeFilter === item.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(item.key as PublishedFilter)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-background transition hover:-translate-y-0.5 hover:border-primary/35 dark:bg-card"
                  >
                    <div className="relative h-72 bg-white">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-contain object-center"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              item.type === "saved-setup"
                                ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,145,178,0.80))"
                                : "linear-gradient(135deg, rgba(88,28,135,0.92), rgba(244,114,182,0.75))",
                          }}
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/40 to-transparent p-5 text-white">
                        <div className="flex items-end justify-between gap-4">
                          <div className="min-w-0 pb-0.5">
                            <div className="line-clamp-2 text-2xl font-semibold leading-tight">
                              {item.title}
                            </div>
                            <div className="mt-2 text-sm text-white/80">{item.status}</div>
                          </div>
                          {item.type === "saved-setup" && item.publishedTemplateId ? (
                            <Button
                              size="sm"
                              asChild
                              className="border-white/10 bg-black/80 text-white hover:bg-black"
                            >
                              <Link href={`/explore/${item.publishedTemplateId}?authorView=1`}>
                                <HugeiconsIcon
                                  icon={ViewIcon}
                                  strokeWidth={2}
                                  data-icon="inline-start"
                                />
                                View
                              </Link>
                            </Button>
                          ) : item.editorHref ? (
                            <Button
                              size="sm"
                              asChild
                              className="border-white/10 bg-black/80 text-white hover:bg-black"
                            >
                              <Link href={item.editorHref}>
                                <HugeiconsIcon
                                  icon={BookBookmark01Icon}
                                  strokeWidth={2}
                                  data-icon="inline-start"
                                />
                                Open
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredItems.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-6 py-12 text-center text-muted-foreground md:col-span-2 dark:bg-card">
                    Belum ada item publish yang cocok dengan pencarian atau filter saat ini.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
