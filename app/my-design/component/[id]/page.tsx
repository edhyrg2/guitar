import { notFound, redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { MyDesignComponentDetailContent } from "@/components/my-design-component-detail-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

export default async function MyDesignComponentDetailPage(
  props: PageProps<"/my-design/component/[id]">
) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-design");
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection is not available.");
  }

  const { id } = await props.params;
  const draft = await prisma.customComponentDraft.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
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
  });

  if (!draft) {
    notFound();
  }

  const item = {
    id: draft.id,
    title: draft.name,
    description: draft.description,
    thumbnailUrl: draft.publishedComponentAsset?.thumbnailUrl ?? draft.thumbnailUrl,
    status:
      draft.status === "PUBLISHED"
        ? "Published Component"
        : draft.status === "UNPUBLISHED"
          ? "Unpublished Component"
          : "Component Draft",
    publishedTemplateName: draft.publishedComponentAssetId ? "Published asset" : null,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    isPublished: draft.status === "PUBLISHED",
  };

  return (
    <SidebarProvider>
      <AppSidebar activePath="/my-design" />
      <SidebarInset>
        <MyDesignComponentDetailContent item={item} />
      </SidebarInset>
    </SidebarProvider>
  );
}
