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
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WireColorSchemaManagementContent } from "@/components/wire-color-schema-management-content";
import {
  getWireColorSchemaReferences,
  getWireColorSchemaRows,
} from "@/lib/wire-color-schema-data";

export default async function WireColorSchemasPage() {
  const [schemas, references] = await Promise.all([
    getWireColorSchemaRows(),
    getWireColorSchemaReferences(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/wire-color-schemas" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search schema, brand, type, color..."
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
                label: "Wire Color Schemas",
                href: "/master-data/wire-color-schemas",
                icon: ColorPickerIcon,
                active: true,
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

          <WireColorSchemaManagementContent
            initialSchemas={schemas}
            brandOptions={references.brands}
            pickupTypeOptions={references.pickupTypes}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
