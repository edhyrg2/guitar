import { redirect } from "next/navigation";
import {
  DashboardSquare01Icon,
  PaintBrush02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";
import { CustomComponentDraftStatus } from "@prisma/client";

import { AppSidebar } from "@/components/app-sidebar";
import { MyDesignContent } from "@/components/my-design-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import type {
  MyDesignItem,
  MyDesignProfile,
  MyDesignStats,
} from "@/lib/my-design-types";
import { getPrismaClient } from "@/lib/prisma";

function getUserPhoto(name: string, photoUrl: string | null) {
  if (photoUrl) {
    return photoUrl;
  }

  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export default async function MyDesignPage() {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-design");
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection is not available.");
  }

  const [user, savedSetups, componentDrafts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        photoUrl: true,
        profileBio: true,
        location: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        xUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.builderSavedSetup.findMany({
      where: { userId: session.user.id },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        publishedTemplateId: true,
        publishedTemplate: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
          },
        },
      },
      take: 24,
    }),
    prisma.customComponentDraft.findMany({
      where: { userId: session.user.id },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        thumbnailUrl: true,
        publishedComponentAssetId: true,
        publishedComponentAsset: {
          select: {
            thumbnailUrl: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      take: 24,
    }),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/my-design");
  }

  const profile: MyDesignProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    level: user.level,
    photo: getUserPhoto(user.name, user.photoUrl),
    photoUrl: user.photoUrl,
    profileBio: user.profileBio,
    location: user.location,
    websiteUrl: user.websiteUrl,
    facebookUrl: user.facebookUrl,
    instagramUrl: user.instagramUrl,
    youtubeUrl: user.youtubeUrl,
    xUrl: user.xUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const items: MyDesignItem[] = [
    ...savedSetups.map((item) => ({
      id: item.id,
      type: "saved-setup" as const,
      title: item.name,
      description: item.description,
      thumbnailUrl: item.publishedTemplate?.thumbnailUrl ?? null,
      status: item.publishedTemplateId ? "Published" : "Draft",
      editorHref: `/custom-builder?savedSetupId=${encodeURIComponent(item.id)}`,
      targetId: item.id,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      publishedTemplateId: item.publishedTemplateId,
      publishedTemplateName: item.publishedTemplate?.name ?? null,
    })),
    ...componentDrafts.map((item) => ({
      id: item.id,
      type: "component-draft" as const,
      title: item.name,
      description: item.description,
      thumbnailUrl:
        item.status === CustomComponentDraftStatus.PUBLISHED
          ? item.publishedComponentAsset?.thumbnailUrl ?? item.thumbnailUrl
          : item.thumbnailUrl,
      status:
        item.status === CustomComponentDraftStatus.PUBLISHED
          ? "Published Component"
          : item.status === CustomComponentDraftStatus.UNPUBLISHED
            ? "Unpublished Component"
            : "Component Draft",
      editorHref: "/custom-component",
      targetId: item.id,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      publishedTemplateId: null,
      publishedTemplateName:
        item.status === CustomComponentDraftStatus.PUBLISHED &&
        item.publishedComponentAssetId
          ? "Published asset"
          : null,
      canUnpublish: item.status === CustomComponentDraftStatus.PUBLISHED,
    })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const stats: MyDesignStats = {
    totalDesigns: items.length,
    savedSetups: savedSetups.length,
    publishedSetups: savedSetups.filter((item) => item.publishedTemplateId).length,
    componentDrafts: componentDrafts.length,
  };

  return (
    <SidebarProvider>
      <AppSidebar activePath="/my-design" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search your profile, social links, and designs..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Workspace", href: "/my-design", icon: PaintBrush02Icon },
              { label: "My Designs", href: "/my-design", icon: UserAccountIcon, active: true },
            ]}
          />

          <MyDesignContent profile={profile} stats={stats} items={items} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
