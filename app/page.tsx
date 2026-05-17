import { AppSidebar } from "@/components/app-sidebar";
import { OverviewContent } from "@/components/overview-content";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar activePath="/" />
      <SidebarInset>
        <OverviewContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
