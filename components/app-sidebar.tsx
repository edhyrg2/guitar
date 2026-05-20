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
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  HelpCircleIcon,
  LibraryIcon,
  NoteIcon,
  PaintBrush02Icon,
  ColorPickerIcon,
  Settings01Icon,
  StarsIcon,
  Tag01Icon,
  UserAccountIcon,
  ViewIcon,
  VolumeHighIcon,
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
  SidebarInput,
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

type SidebarItem =
  | {
      title: string;
      href: string;
      icon: IconSvgElement;
      active?: boolean;
      badge?: string;
    }
  | {
      title: string;
      href: string;
      customIcon: true;
      active?: boolean;
      badge?: string;
    };

const primaryItems: SidebarItem[] = [
  { title: "Overview", href: "/", icon: DashboardSquare01Icon, badge: "Live" },
  { title: "Explore Wiring", href: "/explore", icon: ViewIcon, badge: "New" },
  { title: "My Design", href: "/my-design", icon: UserAccountIcon, badge: "Mine" },
  { title: "Custom Builder", href: "/custom-builder", icon: PaintBrush02Icon },
  { title: "Custom Component", href: "/custom-component", icon: PaintBrush02Icon },
  { title: "Saved Setups", href: "/saved-setups", icon: BookBookmark01Icon },
];

const secondaryItems: SidebarItem[] = [
  { title: "Users", href: "/users", icon: UserAccountIcon, badge: "DB" },
  { title: "Popular Mods", href: "#", icon: StarsIcon, badge: "5" },
  { title: "Settings", href: "#", icon: Settings01Icon },
  { title: "Help", href: "#", icon: HelpCircleIcon },
];

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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/"
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
                <span className="truncate text-sidebar-foreground/70">
                  for Guitar
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput placeholder="Search" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Primary</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link
                    href={item.href}
                    data-slot="sidebar-menu-button"
                    data-sidebar="menu-button"
                    data-size="default"
                    data-active={item.href === activePath}
                    className={cn(
                      sidebarMenuButtonVariants({ size: "default" })
                    )}
                  >
                    {"customIcon" in item ? (
                      <GuitarIcon />
                    ) : (
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    )}
                    <span>{item.title}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-sidebar-accent-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activePath.startsWith("/guitar")}
                  onClick={() => setGuitarOpen((value) => !value)}
                >
                  <GuitarIcon />
                  <span>Guitar</span>
                  <HugeiconsIcon
                    icon={guitarOpen ? ArrowDown01Icon : ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto"
                  />
                </SidebarMenuButton>
                {guitarOpen ? (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/guitar/brands"}
                      >
                        <Link href="/guitar/brands">
                          <GuitarIcon />
                          <span>Guitar Brand</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/guitar/models"}
                      >
                        <Link href="/guitar/models">
                          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                          <span>Guitar Models</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activePath.startsWith("/master-data")}
                  onClick={() => setMasterDataOpen((value) => !value)}
                >
                  <HugeiconsIcon icon={NoteIcon} strokeWidth={2} />
                  <span>Components</span>
                  <HugeiconsIcon
                    icon={masterDataOpen ? ArrowDown01Icon : ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto"
                  />
                </SidebarMenuButton>
                {masterDataOpen ? (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/brands"}
                      >
                        <Link href="/master-data/brands">
                          <GuitarIcon />
                          <span>Pickup Brand</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/pickup-types"}
                      >
                        <Link href="/master-data/pickup-types">
                          <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />
                          <span>Pickup Types</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/pickup-models"}
                      >
                        <Link href="/master-data/pickup-models">
                          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                          <span>Pickup Models</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/wire-color-schemas"}
                      >
                        <Link href="/master-data/wire-color-schemas">
                          <HugeiconsIcon icon={ColorPickerIcon} strokeWidth={2} />
                          <span>Wire Color Schema</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/pickup-configurations"}
                      >
                        <Link href="/master-data/pickup-configurations">
                          <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />
                          <span>Pickup Configuration</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/switch-types"}
                      >
                        <Link href="/master-data/switch-types">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Switch Type</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/pot-types"}
                      >
                        <Link href="/master-data/pot-types">
                          <HugeiconsIcon icon={VolumeHighIcon} strokeWidth={2} />
                          <span>Potentiometer</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/output-jacks"}
                      >
                        <Link href="/master-data/output-jacks">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Output Jack</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/capacitors"}
                      >
                        <Link href="/master-data/capacitors">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Capacitor</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/resistors"}
                      >
                        <Link href="/master-data/resistors">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Resistor</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/mods"}
                      >
                        <Link href="/master-data/mods">
                          <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                          <span>Accessory / Mod</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/master-data/component-assets"}
                      >
                        <Link href="/master-data/component-assets">
                          <HugeiconsIcon icon={LibraryIcon} strokeWidth={2} />
                          <span>Component Asset</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activePath.startsWith("/wiring")}
                  onClick={() => setWiringOpen((value) => !value)}
                >
                  <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                  <span>Wiring</span>
                  <HugeiconsIcon
                    icon={wiringOpen ? ArrowDown01Icon : ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto"
                  />
                </SidebarMenuButton>
                {wiringOpen ? (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/connection-points"}
                      >
                        <Link href="/wiring/connection-points">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Connection Point</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/wire-types"}
                      >
                        <Link href="/wiring/wire-types">
                          <HugeiconsIcon icon={ColorPickerIcon} strokeWidth={2} />
                          <span>Wire Type</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/templates"}
                      >
                        <Link href="/wiring/templates">
                          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                          <span>Wiring Template</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/diagram-sources"}
                      >
                        <Link href="/wiring/diagram-sources">
                          <HugeiconsIcon icon={BookBookmark01Icon} strokeWidth={2} />
                          <span>Diagram Source</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/template-components"}
                      >
                        <Link href="/wiring/template-components">
                          <HugeiconsIcon icon={LibraryIcon} strokeWidth={2} />
                          <span>Template Components</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePath === "/wiring/template-connections"}
                      >
                        <Link href="/wiring/template-connections">
                          <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                          <span>Template Connections</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link
                  href="/ai/diagram-import"
                  data-slot="sidebar-menu-button"
                  data-sidebar="menu-button"
                  data-size="default"
                  data-active={activePath === "/ai/diagram-import"}
                  className={cn(
                    sidebarMenuButtonVariants({ size: "default" })
                  )}
                >
                  <HugeiconsIcon icon={StarsIcon} strokeWidth={2} />
                  <span>AI Diagram Import</span>
                  <span className="ml-auto rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-sidebar-accent-foreground">
                    AI
                  </span>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link
                    href={item.href}
                    data-slot="sidebar-menu-button"
                    data-sidebar="menu-button"
                    data-size="default"
                    data-active={item.href === activePath}
                    className={cn(
                      sidebarMenuButtonVariants({ size: "default" })
                    )}
                  >
                    {"customIcon" in item ? (
                      <GuitarIcon />
                    ) : (
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    )}
                    <span>{item.title}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-sidebar-accent-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuItem>
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
            level={levelLabelMap[session.user.level]}
            photo={session.user.photo}
          />
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
