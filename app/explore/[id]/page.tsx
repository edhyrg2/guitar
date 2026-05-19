import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getWiringTemplateDetailById } from "@/lib/wiring-template-data";

export default async function ExploreTemplateDetailPage(
  props: PageProps<"/explore/[id]">
) {
  const { id } = await props.params;
  const template = await getWiringTemplateDetailById(id);

  if (!template) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <WiringTemplateDetailContent template={template} />
      </SidebarInset>
    </SidebarProvider>
  );
}
