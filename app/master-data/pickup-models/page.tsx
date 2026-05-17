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
import { PickupModelManagementContent } from "@/components/pickup-model-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getPickupModelReferences,
  getPickupModelRows,
} from "@/lib/pickup-model-data";

export default async function PickupModelsPage() {
  const [pickupModels, references] = await Promise.all([
    getPickupModelRows(),
    getPickupModelReferences(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/pickup-models" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search pickup model, brand, type, magnet..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Pickup Brand",
                href: "/master-data/brands",
                icon: NoteIcon,
              },
              {
                label: "Pickup Types",
                href: "/master-data/pickup-types",
                icon: Tag01Icon,
              },
              {
                label: "Pickup Models",
                href: "/master-data/pickup-models",
                icon: ViewIcon,
                active: true,
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
            ]}
          />

          <PickupModelManagementContent
            initialPickupModels={pickupModels}
            brandOptions={references.brands}
            pickupTypeOptions={references.pickupTypes}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
