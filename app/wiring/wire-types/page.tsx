import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { WireTypeManagementContent } from "@/components/wire-type-management-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getWireTypeRows } from "@/lib/wire-type-data";

export default async function WireTypesPage() {
  const wireTypes = await getWireTypeRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/wire-types" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search wire type, color, function, hex..."
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
                active: true,
              },
            ]}
          />

          <WireTypeManagementContent initialWireTypes={wireTypes} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
