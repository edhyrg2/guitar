import { AppSidebar } from "@/components/app-sidebar";
import { OverviewContent } from "@/components/overview-content";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar activePath="/dashboard" />
      <SidebarInset>
        <OverviewContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
