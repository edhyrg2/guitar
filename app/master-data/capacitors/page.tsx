import {
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  NoteIcon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { CapacitorManagementContent } from "@/components/capacitor-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCapacitorRows } from "@/lib/capacitor-data";

export default async function CapacitorsPage() {
  const capacitors = await getCapacitorRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/capacitors" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search capacitor, value, type, voltage..."
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
                label: "Capacitors",
                href: "/master-data/capacitors",
                icon: ElectricPlugsIcon,
                active: true,
              },
            ]}
          />

          <CapacitorManagementContent initialCapacitors={capacitors} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
