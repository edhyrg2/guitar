import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import {
  getWiringTemplateDetailByIdForUser,
  incrementWiringTemplateViewCount,
} from "@/lib/wiring-template-data";

export default async function ExploreTemplateDetailPage(
  props: PageProps<"/explore/[id]"> & {
    searchParams?: Promise<{
      authorView?: string;
      editorHref?: string;
    }>;
  }
) {
  const { id } = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const session = await getSafeServerSession();
  await incrementWiringTemplateViewCount(id);
  const template = await getWiringTemplateDetailByIdForUser(
    id,
    session?.user?.id ?? null
  );

  if (!template) {
    notFound();
  }

  const userId = session?.user?.id ?? null;
  const isAuthor = Boolean(userId && template.creatorId === userId);

  // Resolve editHref: use searchParams if provided, otherwise find linked saved setup
  let editHref = searchParams.editorHref?.trim() || "/custom-builder";
  if (isAuthor && !searchParams.editorHref) {
    const prisma = await getPrismaClient();
    if (prisma) {
      const linkedSetup = await prisma.builderSavedSetup.findFirst({
        where: { publishedTemplateId: id, userId: userId! },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
      });
      if (linkedSetup) {
        editHref = `/custom-builder?savedSetupId=${linkedSetup.id}`;
      }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <WiringTemplateDetailContent
          template={template}
          editHref={editHref}
          showEditButton={isAuthor || searchParams.authorView?.trim() === "1"}
          currentUserId={userId}
          isAuthor={isAuthor}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
