import { AppSidebar } from "@/components/app-sidebar";
import { ExploreWiringTemplatesContent } from "@/components/explore-wiring-templates-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getWiringTemplateRowsForUser } from "@/lib/wiring-template-data";

export default async function ExplorePage() {
  const session = await getSafeServerSession();
  const templates = await getWiringTemplateRowsForUser(session?.user?.id ?? null);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/explore" />
      <SidebarInset>
        <ExploreWiringTemplatesContent templates={templates} />
      </SidebarInset>
    </SidebarProvider>
  );
}
