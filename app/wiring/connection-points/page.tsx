import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { ComponentConnectionPointManagementContent } from "@/components/component-connection-point-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getComponentConnectionPointReferences,
  getComponentConnectionPointRows,
} from "@/lib/component-connection-point-data";

export default async function ConnectionPointsPage() {
  const [points, componentAssetOptions] = await Promise.all([
    getComponentConnectionPointRows(),
    getComponentConnectionPointReferences(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/connection-points" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search connection point, asset, type, coordinates..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Component Asset",
                href: "/master-data/component-assets",
                icon: LibraryIcon,
              },
              {
                label: "Connection Points",
                href: "/wiring/connection-points",
                icon: ElectricPlugsIcon,
                active: true,
              },
            ]}
          />

          <ComponentConnectionPointManagementContent
            initialComponentConnectionPoints={points}
            componentAssetOptions={componentAssetOptions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
