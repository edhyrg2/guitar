"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Camera01Icon,
  Edit02Icon,
  LinkSquare02Icon,
  Location01Icon,
  Mail01Icon,
  NoteIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  MyDesignItem,
  MyDesignProfile,
  MyDesignStats,
} from "@/lib/my-design-types";

type MyDesignContentProps = {
  profile: MyDesignProfile;
  stats: MyDesignStats;
  items: MyDesignItem[];
};

type ProfileFormState = {
  profileBio: string;
  location: string;
  city: string;
  country: string;
  isBuilder: boolean;
  builderWorkshopName: string;
  builderBio: string;
  builderSpecialty: string;
  builderExperienceYears: string;
  builderPortfolioUrl: string;
  builderShopUrl: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  xUrl: string;
};

type DesignFilter = "all" | "saved-setup" | "component-draft" | "published";

function isImageSource(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return (
    value.startsWith("/") ||
    /^(https?:\/\/|blob:|data:)/i.test(value)
  );
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

function createInitialForm(profile: MyDesignProfile): ProfileFormState {
  return {
    profileBio: profile.profileBio ?? "",
    location: profile.location ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    isBuilder: profile.isBuilder,
    builderWorkshopName: profile.builderWorkshopName ?? "",
    builderBio: profile.builderBio ?? "",
    builderSpecialty: profile.builderSpecialty ?? "",
    builderExperienceYears: profile.builderExperienceYears?.toString() ?? "",
    builderPortfolioUrl: profile.builderPortfolioUrl ?? "",
    builderShopUrl: profile.builderShopUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    facebookUrl: profile.facebookUrl ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    youtubeUrl: profile.youtubeUrl ?? "",
    xUrl: profile.xUrl ?? "",
  };
}

export function MyDesignContent({
  profile: initialProfile,
  stats,
  items: initialItems,
}: MyDesignContentProps) {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = React.useState(initialProfile);
  const [itemOverrides, setItemOverrides] = React.useState<
    Record<string, Partial<MyDesignItem>>
  >({});
  const [form, setForm] = React.useState(() => createInitialForm(initialProfile));
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<DesignFilter>("all");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const deferredQuery = React.useDeferredValue(query);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const avatarPreviewUrlRef = React.useRef<string | null>(null);

  const items = React.useMemo(
    () =>
      initialItems.map((item) => ({
        ...item,
        ...itemOverrides[item.id],
      })),
    [initialItems, itemOverrides]
  );

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
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "published"
            ? (item.type === "saved-setup" && item.publishedTemplateId) ||
              item.status === "Published Component"
            : item.type === activeFilter;

      if (!matchesFilter) {
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

  function updateField<Key extends keyof ProfileFormState>(
    field: Key,
    value: ProfileFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProfile() {
    setFeedback(null);

    const response = await fetch("/api/my-design/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as
      | {
          error?: string;
          photo?: string | null;
          profileBio?: string | null;
          location?: string | null;
          city?: string | null;
          country?: string | null;
          isBuilder?: boolean;
          builderWorkshopName?: string | null;
          builderBio?: string | null;
          builderSpecialty?: string | null;
          builderExperienceYears?: number | null;
          builderPortfolioUrl?: string | null;
          builderShopUrl?: string | null;
          websiteUrl?: string | null;
          facebookUrl?: string | null;
          instagramUrl?: string | null;
          youtubeUrl?: string | null;
          xUrl?: string | null;
          updatedAt?: string;
        }
      | undefined;

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to update profile.");
    }

    let nextProfile: MyDesignProfile = {
      ...profile,
      photo: payload?.photo ?? profile.photo,
      photoUrl: payload?.photo ?? profile.photoUrl ?? profile.photo,
      profileBio: payload?.profileBio ?? null,
      location: payload?.location ?? null,
      city: payload?.city ?? null,
      country: payload?.country ?? null,
      isBuilder: payload?.isBuilder ?? false,
      builderWorkshopName: payload?.builderWorkshopName ?? null,
      builderBio: payload?.builderBio ?? null,
      builderSpecialty: payload?.builderSpecialty ?? null,
      builderExperienceYears: payload?.builderExperienceYears ?? null,
      builderPortfolioUrl: payload?.builderPortfolioUrl ?? null,
      builderShopUrl: payload?.builderShopUrl ?? null,
      websiteUrl: payload?.websiteUrl ?? null,
      facebookUrl: payload?.facebookUrl ?? null,
      instagramUrl: payload?.instagramUrl ?? null,
      youtubeUrl: payload?.youtubeUrl ?? null,
      xUrl: payload?.xUrl ?? null,
      updatedAt: payload?.updatedAt ?? profile.updatedAt,
    };

    if (avatarFile) {
      const avatarFormData = new FormData();
      avatarFormData.append("imageFile", avatarFile);

      const avatarResponse = await fetch("/api/my-design/profile/avatar", {
        method: "POST",
        body: avatarFormData,
      });
      const avatarPayload = (await avatarResponse.json()) as
        | {
            error?: string;
            photo?: string | null;
            updatedAt?: string;
          }
        | undefined;

      if (!avatarResponse.ok) {
        throw new Error(avatarPayload?.error || "Failed to upload avatar.");
      }

      nextProfile = {
        ...nextProfile,
        photo: avatarPayload?.photo ?? nextProfile.photo,
        photoUrl:
          avatarPayload?.photo ?? nextProfile.photoUrl ?? nextProfile.photo,
        updatedAt: avatarPayload?.updatedAt ?? nextProfile.updatedAt,
      };
    }

    setProfile(nextProfile);
    setForm(createInitialForm(nextProfile));
    setAvatarFile(null);
    setFeedback("Profile updated.");
    setEditDialogOpen(false);
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = null;
    }
    setAvatarPreviewUrl(null);

    await updateSession?.({
      user: {
        photo: nextProfile.photo,
      },
    });
  }

  async function unpublishComponentDraft(itemId: string) {
    setFeedback(null);
    setActiveItemId(itemId);

    try {
      const response = await fetch(`/api/custom-component-drafts/${itemId}/unpublish`, {
        method: "POST",
      });

      const payload = (await response.json()) as
        | {
            error?: string;
          }
        | undefined;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to unpublish component.");
      }

      setItemOverrides((current) => ({
        ...current,
        [itemId]: {
          status: "Unpublished Component",
          publishedTemplateName: null,
          canUnpublish: false,
        },
      }));
      setFeedback("Component unpublished.");
    } finally {
      setActiveItemId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(241,245,249,0.72))] px-4 py-6 text-foreground dark:bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(23,23,23,0.98))] sm:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:bg-background/90 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(135deg,rgba(18,18,18,0.98),rgba(28,28,28,0.96))] sm:px-8">
          {/* Profile section */}
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
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Edit Profile
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4" />
                      {profile.email}
                    </span>
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
                  </div>
                </div>

                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {profile.profileBio ||
                    "Add a profile description to explain your wiring style, experimental focus, or signature design approach."}
                </p>

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
                      No social links yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[560px]">
              {[
                { label: "Total Designs", value: String(stats.totalDesigns) },
                { label: "Saved Setups", value: String(stats.savedSetups) },
                { label: "Published", value: String(stats.publishedSetups) },
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

        {/* Builder section */}
        {profile.isBuilder ? (
          <div className="border-t border-border/70 bg-background/95 px-6 py-6 dark:bg-background/80 sm:px-8">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Wrench01Icon}
                strokeWidth={2}
                className="size-4 text-primary"
              />
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Builder Profile
              </h2>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5">
                <div className="text-lg font-semibold text-foreground">
                  {profile.builderWorkshopName || "Guitar Builder"}
                </div>
                {profile.builderSpecialty ? (
                  <div className="text-sm text-muted-foreground">{profile.builderSpecialty}</div>
                ) : null}
                {profile.builderBio ? (
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {profile.builderBio}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                {profile.builderExperienceYears !== null ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 dark:bg-muted/10">
                    <div className="text-xl font-semibold text-foreground">
                      {profile.builderExperienceYears}
                    </div>
                    <div className="mt-0.5 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                      Years Experience
                    </div>
                  </div>
                ) : null}
                {profile.builderPortfolioUrl ? (
                  <a
                    href={getLinkHref(profile.builderPortfolioUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 dark:bg-muted/10"
                  >
                    <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-4" />
                    Portfolio
                  </a>
                ) : null}
                {profile.builderShopUrl ? (
                  <a
                    href={getLinkHref(profile.builderShopUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 dark:bg-muted/10"
                  >
                    <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-4" />
                    Shop
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-2xl">My Designs</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                All setups and component drafts for this account.
              </p>
            </div>
            <div className="w-full sm:w-[320px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search designs, drafts, or templates..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "saved-setup", label: "Saved Setups" },
                { key: "component-draft", label: "Component Drafts" },
                { key: "published", label: "Published" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={activeFilter === item.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(item.key as DesignFilter)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground">
                {feedback}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-background transition hover:-translate-y-0.5 hover:border-primary/35 dark:bg-card"
                >
                  <Link
                    href={
                      item.type === "saved-setup"
                        ? `/my-design/setup/${item.id}`
                        : `/my-design/component/${item.id}`
                    }
                    className="block"
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
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                        <div className="line-clamp-1 text-sm font-semibold leading-tight">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-white/70">{item.status}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}

              {filteredItems.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-6 py-12 text-center text-muted-foreground md:col-span-2 dark:bg-card">
                  No designs match the current filter or search.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (open) {
            if (avatarPreviewUrlRef.current) {
              URL.revokeObjectURL(avatarPreviewUrlRef.current);
              avatarPreviewUrlRef.current = null;
            }
            setForm(createInitialForm(profile));
            setFeedback(null);
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
          } else {
            if (avatarPreviewUrlRef.current) {
              URL.revokeObjectURL(avatarPreviewUrlRef.current);
              avatarPreviewUrlRef.current = null;
            }
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile description, location, and social media for the My Design page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 px-4 py-2 sm:px-6">
            <div className="grid gap-5 rounded-3xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-3xl font-semibold tracking-tight text-white shadow-lg">
                {isImageSource(avatarPreviewUrl ?? profile.photo) ? (
                  <Image
                    src={(avatarPreviewUrl ?? profile.photo)!}
                    alt={profile.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  getInitials(profile.name)
                )}
              </div>

              <div className="grid gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Profile Avatar</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Upload a JPG, PNG, or WEBP avatar. The image will be automatically
                    cropped to a square.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <HugeiconsIcon
                      icon={Camera01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    {avatarFile ? "Change Avatar" : "Upload Avatar"}
                  </Button>
                  {avatarFile ? (
                    <div className="text-sm text-muted-foreground">{avatarFile.name}</div>
                  ) : null}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;

                    if (avatarPreviewUrlRef.current) {
                      URL.revokeObjectURL(avatarPreviewUrlRef.current);
                      avatarPreviewUrlRef.current = null;
                    }

                    if (nextFile) {
                      const nextPreviewUrl = URL.createObjectURL(nextFile);
                      avatarPreviewUrlRef.current = nextPreviewUrl;
                      setAvatarPreviewUrl(nextPreviewUrl);
                    } else {
                      setAvatarPreviewUrl(null);
                    }

                    setAvatarFile(nextFile);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Profile Description</label>
              <textarea
                value={form.profileBio}
                onChange={(event) => updateField("profileBio", event.target.value)}
                rows={5}
                className="min-h-36 w-full rounded-2xl border border-input bg-input/20 px-4 py-3 text-sm leading-6 outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
                placeholder="Describe your design focus, favorite wiring references, or experimental approaches you often use."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <label className="text-sm font-medium text-foreground">Location</label>
                <Input
                  value={form.location ?? ""}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder="Bandung, Indonesia"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <Input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Bandung"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country</label>
                <Input
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Indonesia"
                />
              </div>
              <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isBuilder}
                  onChange={(event) => updateField("isBuilder", event.target.checked)}
                  className="size-4"
                />
                Guitar builder
              </label>
            </div>

            <div className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Workshop / Brand Name</label>
                <Input
                  value={form.builderWorkshopName}
                  onChange={(event) => updateField("builderWorkshopName", event.target.value)}
                  placeholder="Your guitar workshop"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Specialty</label>
                <Input
                  value={form.builderSpecialty}
                  onChange={(event) => updateField("builderSpecialty", event.target.value)}
                  placeholder="Custom electric guitars, rewiring, pickups"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Years of Experience</label>
                <Input
                  type="number"
                  min={0}
                  value={form.builderExperienceYears}
                  onChange={(event) => updateField("builderExperienceYears", event.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Builder Bio</label>
                <Input
                  value={form.builderBio}
                  onChange={(event) => updateField("builderBio", event.target.value)}
                  placeholder="Short builder profile"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Portfolio URL</label>
                <Input
                  value={form.builderPortfolioUrl}
                  onChange={(event) => updateField("builderPortfolioUrl", event.target.value)}
                  placeholder="https://portfolio.example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Shop URL</label>
                <Input
                  value={form.builderShopUrl}
                  onChange={(event) => updateField("builderShopUrl", event.target.value)}
                  placeholder="https://shop.example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["websiteUrl", "Website", "https://yourstudio.com"],
                ["facebookUrl", "Facebook", "https://facebook.com/username"],
                ["instagramUrl", "Instagram", "https://instagram.com/username"],
                ["youtubeUrl", "YouTube", "https://youtube.com/@channel"],
                ["xUrl", "X / Twitter", "https://x.com/username"],
              ].map(([field, label, placeholder]) => (
                <div
                  key={field}
                  className={field === "xUrl" ? "space-y-2 sm:col-span-2" : "space-y-2"}
                >
                  <label className="text-sm font-medium text-foreground">{label}</label>
                  <Input
                    value={(form[field as keyof ProfileFormState] as string) ?? ""}
                    onChange={(event) =>
                      updateField(field as keyof ProfileFormState, event.target.value as never)
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground">
                {feedback}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  void saveProfile().catch((error: unknown) => {
                    setFeedback(
                      error instanceof Error ? error.message : "Failed to update profile."
                    );
                  });
                })
              }
            >
              <HugeiconsIcon icon={NoteIcon} strokeWidth={2} data-icon="inline-start" />
              {isPending ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
