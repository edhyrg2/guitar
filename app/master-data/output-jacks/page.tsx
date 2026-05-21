import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  NoteIcon,
  Settings01Icon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { OutputJackManagementContent } from "@/components/output-jack-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getOutputJackRows } from "@/lib/output-jack-data";

export default async function OutputJacksPage() {
  const outputJacks = await getOutputJackRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/output-jacks" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search output jack, mount, conductors, asset..."
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
                label: "Output Jacks",
                href: "/master-data/output-jacks",
                icon: ElectricPlugsIcon,
                active: true,
              },
              {
                label: "Accessory / Mod",
                href: "/master-data/mods",
                icon: Settings01Icon,
              },
            ]}
          />

          <OutputJackManagementContent initialOutputJacks={outputJacks} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
