import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  NoteIcon,
  Settings01Icon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { ComponentAssetManagementContent } from "@/components/component-asset-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getComponentAssetCatalogGroups } from "@/lib/component-asset-catalog";
import { getComponentAssetRows } from "@/lib/component-asset-data";

export default async function ComponentAssetsPage() {
  const [componentAssets, catalogGroups] = await Promise.all([
    getComponentAssetRows(),
    getComponentAssetCatalogGroups(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/component-assets" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search component asset, type, style, svg..."
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
              },
              {
                label: "Switch Type",
                href: "/master-data/switch-types",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Potentiometer",
                href: "/master-data/pot-types",
                icon: VolumeHighIcon,
              },
              {
                label: "Capacitor",
                href: "/master-data/capacitors",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Resistor",
                href: "/master-data/resistors",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Accessory / Mod",
                href: "/master-data/mods",
                icon: Settings01Icon,
              },
              {
                label: "Component Asset",
                href: "/master-data/component-assets",
                icon: LibraryIcon,
                active: true,
              },
            ]}
          />

          <ComponentAssetManagementContent
            initialComponentAssets={componentAssets}
            catalogGroups={catalogGroups}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
