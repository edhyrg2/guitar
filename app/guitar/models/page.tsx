import {
  DashboardSquare01Icon,
  UserAccountIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { GuitarModelManagementContent } from "@/components/guitar-model-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getGuitarModelReferences,
  getGuitarModelRows,
} from "@/lib/guitar-model-data";

export default async function GuitarModelsPage() {
  const [guitarModels, references] = await Promise.all([
    getGuitarModelRows(),
    getGuitarModelReferences(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/guitar/models" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search guitar model, brand, series, body type..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Guitar Brand",
                href: "/guitar/brands",
                customIcon: "guitar",
              },
              {
                label: "Guitar Models",
                href: "/guitar/models",
                icon: ViewIcon,
                active: true,
              },
            ]}
          />

          <GuitarModelManagementContent
            initialGuitarModels={guitarModels}
            guitarBrandOptions={references.guitarBrands}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
