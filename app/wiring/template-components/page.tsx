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
import { WiringTemplateComponentManagementContent } from "@/components/wiring-template-component-management-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getWiringTemplateComponentAssetOptions,
  getWiringTemplateComponentRows,
  getWiringTemplateComponentTemplateOptions,
} from "@/lib/wiring-template-component-data";

export default async function WiringTemplateComponentsPage() {
  const [components, wiringTemplateOptions, assetOptions] = await Promise.all([
    getWiringTemplateComponentRows(),
    getWiringTemplateComponentTemplateOptions(),
    getWiringTemplateComponentAssetOptions(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/template-components" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search template component, role, asset, type..."
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
                label: "Template Components",
                href: "/wiring/template-components",
                icon: LibraryIcon,
                active: true,
              },
            ]}
          />

          <WiringTemplateComponentManagementContent
            initialComponents={components}
            wiringTemplateOptions={wiringTemplateOptions}
            assetOptions={assetOptions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
