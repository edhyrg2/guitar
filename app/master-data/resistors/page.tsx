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
import { ResistorManagementContent } from "@/components/resistor-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getResistorRows } from "@/lib/resistor-data";

export default async function ResistorsPage() {
  const resistors = await getResistorRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/resistors" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search resistor, value, wattage, tolerance..."
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
                active: true,
              },
            ]}
          />

          <ResistorManagementContent initialResistors={resistors} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
