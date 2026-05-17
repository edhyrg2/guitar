import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  StarsIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AiDiagramImportContent } from "@/components/ai-diagram-import-content";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getComponentAssetRows } from "@/lib/component-asset-data";
import { getComponentConnectionPointRows } from "@/lib/component-connection-point-data";
import { getPickupConfigurationRows } from "@/lib/pickup-configuration-data";
import { getSwitchTypeRows } from "@/lib/switch-type-data";
import { getWireTypeRows } from "@/lib/wire-type-data";

export default async function AiDiagramImportPage() {
  const [
    pickupConfigurations,
    switchTypes,
    componentAssets,
    connectionPoints,
    wireTypes,
  ] = await Promise.all([
    getPickupConfigurationRows(),
    getSwitchTypeRows(),
    getComponentAssetRows(),
    getComponentConnectionPointRows(),
    getWireTypeRows(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/ai/diagram-import" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search assets, wire types, point keys, and import references..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "AI Diagram Import",
                href: "/ai/diagram-import",
                icon: StarsIcon,
                active: true,
              },
              {
                label: "Wiring Templates",
                href: "/wiring/templates",
                icon: ElectricPlugsIcon,
              },
            ]}
          />

          <AiDiagramImportContent
            pickupConfigurations={pickupConfigurations}
            switchTypes={switchTypes}
            componentAssets={componentAssets}
            connectionPoints={connectionPoints}
            wireTypes={wireTypes}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
