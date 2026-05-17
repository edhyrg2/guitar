import {
  ElectricPlugsIcon,
  DashboardSquare01Icon,
  NoteIcon,
  ColorPickerIcon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { BrandManagementContent } from "@/components/brand-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getBrandRows } from "@/lib/brand-data";

export default async function BrandsPage() {
  const brands = await getBrandRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/master-data/brands" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search brand, slug, type, country..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Pickup Brand",
                href: "/master-data/brands",
                icon: NoteIcon,
                active: true,
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

          <BrandManagementContent initialBrands={brands} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
