import {
  DashboardSquare01Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { UserManagementContent } from "@/components/user-management-content";
import { getUserRows } from "@/lib/user-data";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function UsersPage() {
  const users = await getUserRows();

  return (
    <SidebarProvider>
      <AppSidebar activePath="/users" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search user, email, level..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon, active: true },
              { label: "Permissions" },
            ]}
          />

          <UserManagementContent initialUsers={users} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
