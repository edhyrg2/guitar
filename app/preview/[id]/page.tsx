import { notFound } from "next/navigation";

import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { PublicGalleryNavbar } from "@/components/public-gallery-navbar";
import { getSafeServerSession } from "@/lib/auth-session";
import {
  getWiringTemplateDetailByIdForUser,
  incrementWiringTemplateViewCount,
} from "@/lib/wiring-template-data";

export default async function PublicPreviewPage(
  props: PageProps<"/preview/[id]">
) {
  const { id } = await props.params;
  const session = await getSafeServerSession();

  await incrementWiringTemplateViewCount(id);

  const template = await getWiringTemplateDetailByIdForUser(
    id,
    session?.user?.id ?? null
  );

  if (!template) {
    notFound();
  }

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
        />
      </main>
    </div>
  );
}
