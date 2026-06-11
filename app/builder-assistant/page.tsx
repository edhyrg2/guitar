import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  MagicWand01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { BuilderAssistantContent } from "@/components/builder-assistant-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getModRows } from "@/lib/mod-data";
import { getPickupConfigurationRows } from "@/lib/pickup-configuration-data";
import { getSwitchTypeRows } from "@/lib/switch-type-data";

export const metadata = {
  title: "Builder Assistant",
  description: "Guided guitar wiring setup wizard before opening the wiring builder.",
};

export default async function BuilderAssistantPage() {
  const [pickupConfigurations, switchTypes, mods] = await Promise.all([
    getPickupConfigurationRows(),
    getSwitchTypeRows(),
    getModRows(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/builder-assistant" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search builder assistant, wiring, mods..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Builder Assistant", href: "/builder-assistant", icon: MagicWand01Icon, active: true },
              { label: "Wiring Builder", href: "/custom-builder", icon: Wrench01Icon },
              { label: "Wiring Library", href: "/explore", icon: ElectricPlugsIcon },
            ]}
          />

          <BuilderAssistantContent
            pickupConfigurations={pickupConfigurations}
            switchTypes={switchTypes}
            mods={mods}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
