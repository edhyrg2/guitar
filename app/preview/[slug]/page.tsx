import { notFound } from "next/navigation";

import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { PublicGalleryNavbar } from "@/components/public-gallery-navbar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import {
  getWiringTemplateDetailBySlugOrId,
  incrementWiringTemplateViewCount,
} from "@/lib/wiring-template-data";

export default async function PublicPreviewPage(
  props: PageProps<"/preview/[slug]">
) {
  const { slug } = await props.params;
  const session = await getSafeServerSession();

  // Resolve slug → id first so view count uses the real id
  const template = await getWiringTemplateDetailBySlugOrId(
    slug,
    session?.user?.id ?? null
  );

  if (!template) {
    notFound();
  }

  await incrementWiringTemplateViewCount(template.id);

  const userId = session?.user?.id ?? null;
  const isAuthor = Boolean(userId && template.creatorId === userId);

  // Find the saved setup linked to this template for the edit button
  let editHref = "/custom-builder";
  if (isAuthor) {
    const prisma = await getPrismaClient();
    if (prisma) {
      const linkedSetup = await prisma.builderSavedSetup.findFirst({
        where: { publishedTemplateId: template.id, userId: userId! },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
      });
      if (linkedSetup) {
        editHref = `/custom-builder?savedSetupId=${linkedSetup.id}`;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicGalleryNavbar />
      <main className="flex-1">
        <WiringTemplateDetailContent
          template={template}
          showEditButton={isAuthor}
          editHref={editHref}
          backHref="/"
          backLabel="Back to Gallery"
          hideNavbar
          currentUserId={userId}
          isAuthor={isAuthor}
        />
      </main>
    </div>
  );
}
