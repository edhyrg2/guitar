import { redirect } from "next/navigation";
import {
  BookBookmark01Icon,
  DashboardSquare01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { SavedSetupsContent } from "@/components/saved-setups-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getSavedWiringTemplateRowsForUser } from "@/lib/wiring-template-data";

export default async function SavedSetupsPage() {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/saved-setups");
  }

  const templates = await getSavedWiringTemplateRowsForUser(session.user.id);

  return (
    <SidebarProvider>
      <AppSidebar activePath="/saved-setups" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search your saved wiring templates..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Explore", href: "/explore", icon: ViewIcon },
              {
                label: "Saved Setups",
                href: "/saved-setups",
                icon: BookBookmark01Icon,
                active: true,
              },
            ]}
          />
          <SavedSetupsContent templates={templates} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
