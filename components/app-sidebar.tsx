"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  BookBookmark01Icon,
  CpuIcon,
  ElectricPlugsIcon,
  FileEditIcon,
  HelpCircleIcon,
  LibraryIcon,
  ColorPickerIcon,
  Settings01Icon,
  SparklesIcon,
  Tag01Icon,
  UserMultipleIcon,
  ViewIcon,
  VolumeHighIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { AuthUserControl } from "@/components/auth-user-control";
import { GuitarIcon } from "@/components/guitar-icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type UserLevel = "USER" | "DEVELOPER" | "MASTER";

type SidebarItem = {
  title: string;
  href: string;
  icon?: IconSvgElement;
  customIcon?: true;
  badge?: string;
};

// Visible to all authenticated users (USER+)
const userPrimaryItems: SidebarItem[] = [
  { title: "Wiring Library", href: "/explore", icon: ViewIcon },
  { title: "Builder Assistant", href: "/builder-assistant", icon: SparklesIcon, badge: "New" },
  { title: "Wiring Builder", href: "/custom-builder", icon: Wrench01Icon },
  { title: "Component Studio", href: "/custom-component", icon: CpuIcon },
  { title: "AI Import", href: "/ai/diagram-import", icon: SparklesIcon },
  { title: "My Designs", href: "/my-design", icon: FileEditIcon },
  { title: "Saved Setups", href: "/saved-setups", icon: BookBookmark01Icon },
];

// Only DEVELOPER+ can see these
const developerPrimaryItems: SidebarItem[] = [];

// Workspace items for USER+
const userWorkspaceItems: SidebarItem[] = [
  { title: "Help", href: "/help", icon: HelpCircleIcon },
];

// Workspace items for DEVELOPER+
const developerWorkspaceItems: SidebarItem[] = [
  { title: "Users", href: "/users", icon: UserMultipleIcon },
  { title: "Settings", href: "#", icon: Settings01Icon },
];

function roleWeight(level: UserLevel): number {
  return { USER: 0, DEVELOPER: 1, MASTER: 2 }[level] ?? 0;
}

function hasRole(userLevel: UserLevel | undefined, required: UserLevel): boolean {
  if (!userLevel) return false;
  return roleWeight(userLevel) >= roleWeight(required);
}

type AppSidebarProps = {
  activePath?: string;
};

export function AppSidebar({ activePath = "/" }: AppSidebarProps) {
  const { data: session } = useSession();
  const [masterDataOpen, setMasterDataOpen] = React.useState(
    activePath.startsWith("/master-data")
  );
  const [guitarOpen, setGuitarOpen] = React.useState(
    activePath.startsWith("/guitar")
  );
  const [wiringOpen, setWiringOpen] = React.useState(
    activePath.startsWith("/wiring")
  );

  const levelLabelMap = {
    USER: "User",
    DEVELOPER: "Developer",
    MASTER: "Master",
  } as const;

  const userLevel = session?.user?.level as UserLevel | undefined;
  const isDeveloper = hasRole(userLevel, "DEVELOPER");

  function NavLink({ item }: { item: SidebarItem }) {
    return (
      <SidebarMenuItem key={item.title}>
        <Link
          href={item.href}
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size="default"
          data-active={item.href === activePath}
          className={cn(sidebarMenuButtonVariants({ size: "default" }))}
        >
          {item.customIcon ? (
            <GuitarIcon />
          ) : item.icon ? (
            <HugeiconsIcon icon={item.icon} strokeWidth={2} />
          ) : null}
          <span>{item.title}</span>
          {item.badge ? (
            <span className="ml-auto rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-sidebar-accent-foreground">
              {item.badge}
            </span>
          ) : null}
        </Link>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/explore"
              data-slot="sidebar-menu-button"
              data-sidebar="menu-button"
              data-size="lg"
              className={cn(sidebarMenuButtonVariants({ size: "lg" }))}
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <GuitarIcon className="size-4.5" />
              </div>
              <div className="grid flex-1 text-left text-xs">
                <span className="truncate font-medium">Wiring Diagrams</span>
                <span className="truncate text-sidebar-foreground/70">for Guitar</span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Primary (USER+) ─────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userPrimaryItems.map((item) => (
                <NavLink key={item.title} item={item} />
              ))}

              {/* ── DEVELOPER+ only below ──────────────────────── */}
              {isDeveloper && (
                <>
                  {developerPrimaryItems.map((item) => (
                    <NavLink key={item.title} item={item} />
                  ))}

                  {/* Guitar submenu */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activePath.startsWith("/guitar")}
                      onClick={() => setGuitarOpen((v) => !v)}
                    >
                      <GuitarIcon />
                      <span>Guitars</span>
                      <HugeiconsIcon
                        icon={guitarOpen ? ArrowDown01Icon : ArrowRight01Icon}
                        strokeWidth={2}
                        className="ml-auto"
                      />
                    </SidebarMenuButton>
                    {guitarOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={activePath === "/guitar/brands"}>
                            <Link href="/guitar/brands">
                              <GuitarIcon />
                              <span>Guitar Brand</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={activePath === "/guitar/models"}>
                            <Link href="/guitar/models">
                              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                              <span>Guitar Models</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>

                  {/* Components submenu */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activePath.startsWith("/master-data")}
                      onClick={() => setMasterDataOpen((v) => !v)}
                    >
                      <HugeiconsIcon icon={CpuIcon} strokeWidth={2} />
                      <span>Components</span>
                      <HugeiconsIcon
                        icon={masterDataOpen ? ArrowDown01Icon : ArrowRight01Icon}
                        strokeWidth={2}
                        className="ml-auto"
                      />
                    </SidebarMenuButton>
                    {masterDataOpen && (
                      <SidebarMenuSub>
                        {[
                          { href: "/master-data/brands", label: "Pickup Brands", icon: null, customIcon: true },
                          { href: "/master-data/pickup-types", label: "Pickup Types", icon: Tag01Icon },
                          { href: "/master-data/pickup-models", label: "Pickup Models", icon: ViewIcon },
                          { href: "/master-data/wire-color-schemas", label: "Wire Color Schemas", icon: ColorPickerIcon },
                          { href: "/master-data/pickup-configurations", label: "Pickup Configurations", icon: Tag01Icon },
                          { href: "/master-data/switch-types", label: "Switch Types", icon: ElectricPlugsIcon },
                          { href: "/master-data/pot-types", label: "Potentiometers", icon: VolumeHighIcon },
                          { href: "/master-data/output-jacks", label: "Output Jacks", icon: ElectricPlugsIcon },
                          { href: "/master-data/capacitors", label: "Capacitors", icon: ElectricPlugsIcon },
                          { href: "/master-data/resistors", label: "Resistors", icon: ElectricPlugsIcon },
                          { href: "/master-data/mods", label: "Mods & Accessories", icon: Settings01Icon },
                          { href: "/master-data/component-assets", label: "Component Assets", icon: LibraryIcon },
                        ].map((sub) => (
                          <SidebarMenuSubItem key={sub.href}>
                            <SidebarMenuSubButton asChild isActive={activePath === sub.href}>
                              <Link href={sub.href}>
                                {sub.customIcon ? (
                                  <GuitarIcon />
                                ) : (
                                  <HugeiconsIcon icon={sub.icon!} strokeWidth={2} />
                                )}
                                <span>{sub.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>

                  {/* Wiring submenu */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activePath.startsWith("/wiring")}
                      onClick={() => setWiringOpen((v) => !v)}
                    >
                      <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                      <span>Wiring Data</span>
                      <HugeiconsIcon
                        icon={wiringOpen ? ArrowDown01Icon : ArrowRight01Icon}
                        strokeWidth={2}
                        className="ml-auto"
                      />
                    </SidebarMenuButton>
                    {wiringOpen && (
                      <SidebarMenuSub>
                        {[
                          { href: "/wiring/connection-points", label: "Connection Points", icon: ElectricPlugsIcon },
                          { href: "/wiring/wire-types", label: "Wire Types", icon: ColorPickerIcon },
                          { href: "/wiring/templates", label: "Wiring Templates", icon: ViewIcon },
                          { href: "/wiring/diagram-sources", label: "Diagram Sources", icon: BookBookmark01Icon },
                          { href: "/wiring/template-components", label: "Template Components", icon: LibraryIcon },
                          { href: "/wiring/template-connections", label: "Template Connections", icon: ElectricPlugsIcon },
                        ].map((sub) => (
                          <SidebarMenuSubItem key={sub.href}>
                            <SidebarMenuSubButton asChild isActive={activePath === sub.href}>
                              <Link href={sub.href}>
                                <HugeiconsIcon icon={sub.icon} strokeWidth={2} />
                                <span>{sub.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Workspace ───────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel>Setting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userWorkspaceItems.map((item) => (
                <NavLink key={item.title} item={item} />
              ))}
              {isDeveloper &&
                developerWorkspaceItems.map((item) => (
                  <NavLink key={item.title} item={item} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {session?.user ? (
          <AuthUserControl
            variant="sidebar"
            name={session.user.name ?? session.user.email ?? "User"}
            level={levelLabelMap[session.user.level as keyof typeof levelLabelMap] ?? "User"}
            photo={session.user.photo}
          />
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
