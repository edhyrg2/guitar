import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
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

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <WiringTemplateDetailContent
          template={template}
          editHref={searchParams.editorHref?.trim() || "/custom-builder"}
          showEditButton={searchParams.authorView?.trim() !== "1"}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
