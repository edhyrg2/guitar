import {
  BookBookmark01Icon,
  ColorPickerIcon,
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { DiagramSourceManagementContent } from "@/components/diagram-source-management-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getDiagramSourceRows,
  getDiagramSourceTemplateOptions,
} from "@/lib/diagram-source-data";

export default async function DiagramSourcesPage() {
  const [diagramSources, wiringTemplateOptions] = await Promise.all([
    getDiagramSourceRows(),
    getDiagramSourceTemplateOptions(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/wiring/diagram-sources" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search diagram source, template, brand, type..."
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
                label: "Diagram Source",
                href: "/wiring/diagram-sources",
                icon: BookBookmark01Icon,
                active: true,
              },
            ]}
          />

          <DiagramSourceManagementContent
            initialDiagramSources={diagramSources}
            wiringTemplateOptions={wiringTemplateOptions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
