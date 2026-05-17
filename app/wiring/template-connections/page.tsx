import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { WiringTemplateConnectionManagementContent } from "@/components/wiring-template-connection-management-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getWiringTemplateConnectionRows,
  getWiringTemplateConnectionTemplateOptions,
  getWiringTemplateConnectionWireTypeOptions,
} from "@/lib/wiring-template-connection-data";

export default async function WiringTemplateConnectionsPage() {
  const [connections, wiringTemplateOptions, wireTypeOptions] =
    await Promise.all([
      getWiringTemplateConnectionRows(),
      getWiringTemplateConnectionTemplateOptions(),
      getWiringTemplateConnectionWireTypeOptions(),
    ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/template-connections" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search template connection, roles, points, wire..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Component Asset",
                href: "/master-data/component-assets",
                icon: LibraryIcon,
              },
              {
                label: "Connection Point",
                href: "/wiring/connection-points",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Wire Type",
                href: "/wiring/wire-types",
                icon: ColorPickerIcon,
              },
              {
                label: "Wiring Template",
                href: "/wiring/templates",
                icon: ViewIcon,
              },
              {
                label: "Template Connections",
                href: "/wiring/template-connections",
                icon: ElectricPlugsIcon,
                active: true,
              },
            ]}
          />

          <WiringTemplateConnectionManagementContent
            initialConnections={connections}
            wiringTemplateOptions={wiringTemplateOptions}
            wireTypeOptions={wireTypeOptions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
