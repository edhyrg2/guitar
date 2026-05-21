import { notFound } from "next/navigation";

import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { PublicGalleryNavbar } from "@/components/public-gallery-navbar";
import { getSafeServerSession } from "@/lib/auth-session";
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

  return (
    <div className="flex min-h-screen flex-col">
      <PublicGalleryNavbar />
      <main className="flex-1">
        <WiringTemplateDetailContent
          template={template}
          showEditButton={false}
          backHref="/"
          backLabel="Back to Gallery"
          hideNavbar
          currentUserId={session?.user?.id ?? null}
        />
      </main>
    </div>
  );
}
