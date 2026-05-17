import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  NoteIcon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { PickupConfigurationManagementContent } from "@/components/pickup-configuration-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPickupConfigurationRows } from "@/lib/pickup-configuration-data";

export default async function PickupConfigurationsPage() {
  const configurations = await getPickupConfigurationRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/pickup-configurations" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search code, name, description..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              { label: "Pickup Brand", href: "/master-data/brands", icon: NoteIcon },
              {
                label: "Pickup Types",
                href: "/master-data/pickup-types",
                icon: Tag01Icon,
              },
              {
                label: "Pickup Models",
                href: "/master-data/pickup-models",
                icon: ViewIcon,
              },
              {
                label: "Wire Color Schema",
                href: "/master-data/wire-color-schemas",
                icon: ColorPickerIcon,
              },
              {
                label: "Pickup Config",
                href: "/master-data/pickup-configurations",
                icon: Tag01Icon,
                active: true,
              },
              {
                label: "Switch Type",
                href: "/master-data/switch-types",
                icon: ElectricPlugsIcon,
              },
            ]}
          />

          <PickupConfigurationManagementContent
            initialConfigurations={configurations}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
