import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  PaintBrush02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import {
  CustomBuilderContent,
  type BuilderAssetDefinition,
} from "@/components/custom-builder-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getComponentAssetRows } from "@/lib/component-asset-data";
import { getComponentConnectionPointRows } from "@/lib/component-connection-point-data";
import { getWireTypeRows } from "@/lib/wire-type-data";

export default async function CustomBuilderPage() {
  const [componentAssets, connectionPoints, wireTypes] = await Promise.all([
    getComponentAssetRows(),
    getComponentConnectionPointRows(),
    getWireTypeRows(),
  ]);

  const builderAssets: BuilderAssetDefinition[] = componentAssets
    .filter((asset) => asset.isActive)
    .map((asset) => ({
      id: asset.id,
      componentType: asset.componentType,
      name: asset.name,
      slug: asset.slug,
      width: asset.width ?? 220,
      height: asset.height ?? 140,
      previewUrl: asset.svgUrl ?? asset.thumbnailUrl,
      styleType: asset.styleType,
      connectionPoints: connectionPoints
        .filter((point) => point.componentAssetId === asset.id)
        .map((point) => ({
          id: point.id,
          pointKey: point.pointKey,
          label: point.label,
          pointType: point.pointType,
          x: point.x,
          y: point.y,
          description: point.description,
        })),
    }))
    .filter((asset) => asset.connectionPoints.length > 0);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/custom-builder" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search builder assets, connection points, and wire types..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Wiring Templates",
                href: "/wiring/templates",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Custom Builder",
                href: "/custom-builder",
                icon: PaintBrush02Icon,
                active: true,
              },
            ]}
          />

          <CustomBuilderContent assets={builderAssets} wireTypes={wireTypes} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
