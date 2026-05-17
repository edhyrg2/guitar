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
import { WiringTemplateManagementContent } from "@/components/wiring-template-management-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getWiringTemplatePickupConfigurationOptions,
  getWiringTemplateRows,
  getWiringTemplateSwitchTypeOptions,
} from "@/lib/wiring-template-data";

export default async function WiringTemplatesPage() {
  const [templates, pickupConfigurationOptions, switchTypeOptions] =
    await Promise.all([
      getWiringTemplateRows(),
      getWiringTemplatePickupConfigurationOptions(),
      getWiringTemplateSwitchTypeOptions(),
    ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/templates" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search wiring template, config, switch, creator..."
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
                active: true,
              },
            ]}
          />

          <WiringTemplateManagementContent
            initialTemplates={templates}
            pickupConfigurationOptions={pickupConfigurationOptions}
            switchTypeOptions={switchTypeOptions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
