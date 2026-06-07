import { notFound } from "next/navigation";
import { CustomComponentDraftStatus } from "@prisma/client";

import { AppSidebar } from "@/components/app-sidebar";
import { PublicUserGalleryContent } from "@/components/public-user-gallery-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { MyDesignItem, MyDesignStats } from "@/lib/my-design-types";
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

export default async function ExploreCreatorPage(
  props: PageProps<"/explore/creator/[id]">
) {
  const { id } = await props.params;
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection is not available.");
  }

  const [user, savedSetups, componentDrafts] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        level: true,
        photoUrl: true,
        profileBio: true,
        location: true,
        city: true,
        country: true,
        isBuilder: true,
        builderWorkshopName: true,
        builderBio: true,
        builderSpecialty: true,
        builderExperienceYears: true,
        builderPortfolioUrl: true,
        builderShopUrl: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        xUrl: true,
      },
    }),
    prisma.builderSavedSetup.findMany({
      where: {
        userId: id,
        publishedTemplateId: {
          not: null,
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
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
      where: {
        userId: id,
        status: CustomComponentDraftStatus.PUBLISHED,
      },
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
            id: true,
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
    notFound();
  }

  const items: MyDesignItem[] = [
    ...savedSetups.map((item) => ({
      id: item.id,
      type: "saved-setup" as const,
      title: item.name,
      description: item.description,
      thumbnailUrl: item.publishedTemplate?.thumbnailUrl ?? null,
      status: "Published" as const,
      editorHref: item.publishedTemplateId ? `/explore/${item.publishedTemplateId}` : "",
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
        item.publishedComponentAsset?.thumbnailUrl ?? item.thumbnailUrl,
      status: "Published Component" as const,
      editorHref: "",
      targetId: item.id,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      publishedTemplateId: null,
      publishedTemplateName: item.publishedComponentAssetId ? "Published asset" : null,
    })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const stats: MyDesignStats = {
    totalDesigns: items.length,
    savedSetups: savedSetups.length,
    publishedSetups: savedSetups.length,
    componentDrafts: componentDrafts.length,
  };

  const profile = {
    id: user.id,
    name: user.name,
    level: user.level,
    photo: getUserPhoto(user.name, user.photoUrl),
    profileBio: user.profileBio,
    location: user.location,
    city: user.city,
    country: user.country,
    isBuilder: user.isBuilder,
    builderWorkshopName: user.builderWorkshopName,
    builderBio: user.builderBio,
    builderSpecialty: user.builderSpecialty,
    builderExperienceYears: user.builderExperienceYears,
    builderPortfolioUrl: user.builderPortfolioUrl,
    builderShopUrl: user.builderShopUrl,
    websiteUrl: user.websiteUrl,
    facebookUrl: user.facebookUrl,
    instagramUrl: user.instagramUrl,
    youtubeUrl: user.youtubeUrl,
    xUrl: user.xUrl,
  };

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <PublicUserGalleryContent profile={profile} stats={stats} items={items} />
      </SidebarInset>
    </SidebarProvider>
  );
}
