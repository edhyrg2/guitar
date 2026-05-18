import { AppSidebar } from "@/components/app-sidebar";
import { ExploreWiringTemplatesContent } from "@/components/explore-wiring-templates-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getWiringTemplateRows } from "@/lib/wiring-template-data";

export default async function ExplorePage() {
  const templates = await getWiringTemplateRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <ExploreWiringTemplatesContent templates={templates} />
      </SidebarInset>
    </SidebarProvider>
  );
}
