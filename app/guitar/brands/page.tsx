import {
  DashboardSquare01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { GuitarBrandManagementContent } from "@/components/guitar-brand-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getGuitarBrandRows } from "@/lib/guitar-brand-data";

export default async function GuitarBrandsPage() {
  const guitarBrands = await getGuitarBrandRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/guitar/brands" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search guitar brand, slug, country, website..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Guitar Brands",
                href: "/guitar/brands",
                customIcon: "guitar",
                active: true,
              },
              {
                label: "Guitar Models",
                href: "/guitar/models",
                icon: ViewIcon,
              },
            ]}
          />

          <GuitarBrandManagementContent initialGuitarBrands={guitarBrands} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
