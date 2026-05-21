import {
  DashboardSquare01Icon,
  ElectricPlugsIcon,
  PaintBrush02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { AppSidebar } from "@/components/app-sidebar";
import { CustomComponentContent } from "@/components/custom-component-content";
import { TopNavbar } from "@/components/top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { normalizeEditorDocument } from "@/lib/custom-component-editor-utils";
import type {
  CustomComponentEditorTarget,
  PublishType,
} from "@/lib/custom-component-publish-target-types";
import { getPrismaClient } from "@/lib/prisma";

type SearchParams = Promise<{
  ownerType?: string;
  ownerId?: string;
}>;

async function getInitialTarget(
  ownerType: string | undefined,
  ownerId: string | undefined
): Promise<CustomComponentEditorTarget | null> {
  if (!ownerType || !ownerId) {
    return null;
  }

  if (
    ownerType !== "switch-type" &&
    ownerType !== "pot-type" &&
    ownerType !== "capacitor" &&
    ownerType !== "resistor" &&
    ownerType !== "pickup-model" &&
    ownerType !== "pickup-type" &&
    ownerType !== "output-jack" &&
    ownerType !== "mod"
  ) {
    return null;
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return null;
  }

  const asset = await prisma.componentAsset.findUnique({
    where: {
      ownerType_ownerId: {
        ownerType,
        ownerId,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      styleType: true,
      editorDocumentJson: true,
      connectionPoints: {
        orderBy: [{ label: "asc" }],
        select: {
          id: true,
          pointKey: true,
          label: true,
          pointType: true,
          x: true,
          y: true,
          description: true,
        },
      },
    },
  });

  let payload: Record<string, unknown> | null = null;

  if (ownerType === "switch-type") {
    payload = await prisma.switchType.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        slug: true,
        positionCount: true,
        poleCount: true,
        lugCount: true,
        switchCategory: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "pot-type") {
    payload = await prisma.potType.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        valueOhm: true,
        valueLabel: true,
        taper: true,
        potFunction: true,
        isPushPull: true,
        isPushPush: true,
        isNoLoad: true,
        shaftType: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "capacitor") {
    payload = await prisma.capacitor.findUnique({
      where: { id: ownerId },
      select: {
        valueFarads: true,
        valueLabel: true,
        type: true,
        voltageRating: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "resistor") {
    payload = await prisma.resistor.findUnique({
      where: { id: ownerId },
      select: {
        valueOhm: true,
        valueLabel: true,
        wattage: true,
        tolerance: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "pickup-model") {
    payload = await prisma.pickupModel.findUnique({
      where: { id: ownerId },
      select: {
        pickupBrandId: true,
        pickupTypeId: true,
        name: true,
        slug: true,
        positionType: true,
        wireCount: true,
        magnetType: true,
        dcResistance: true,
        outputLevel: true,
        colorCodeSchemaId: true,
        description: true,
        isActivePickup: true,
        pickupBrand: {
          select: {
            name: true,
          },
        },
        pickupType: {
          select: {
            name: true,
          },
        },
      },
    });
  } else if (ownerType === "pickup-type") {
    payload = await prisma.pickupType.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        slug: true,
        coilCount: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "output-jack") {
    payload = await prisma.outputJack.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        slug: true,
        jackType: true,
        mountingStyle: true,
        conductorCount: true,
        description: true,
        isActive: true,
      },
    });
  } else if (ownerType === "mod") {
    payload = await prisma.mod.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        slug: true,
        description: true,
        difficultyLevel: true,
        requiresPushPull: true,
        requiresMiniToggle: true,
        requiresSpecialSwitch: true,
        isActive: true,
      },
    });
  }

  if (!payload) {
    return null;
  }

  const fallbackConnectionPoints =
    asset?.connectionPoints.map((point) => ({
      id: point.id,
      key: point.pointKey,
      label: point.label,
      pointType: point.pointType,
      color: "#0f766e",
      x: point.x,
      y: point.y,
      description: point.description,
    })) ?? [];

  const document = asset?.editorDocumentJson
    ? normalizeEditorDocument(asset.editorDocumentJson)
    : {
        version: 1 as const,
        background: "#f8fafc",
        objects: [],
        connectionPoints: fallbackConnectionPoints,
      };

  const nameFallback =
    String(
      payload.name ??
        payload.valueLabel ??
        asset?.name ??
        "Custom Component"
    ).trim() || "Custom Component";

  return {
    ownerType: ownerType as PublishType,
    ownerId,
    assetId: asset?.id ?? null,
    assetName: asset?.name ?? nameFallback,
    assetSlug: asset?.slug ?? "",
    styleType: asset?.styleType ?? null,
    payload,
    document,
  };
}

export default async function CustomComponentPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const initialTarget = await getInitialTarget(
    searchParams.ownerType,
    searchParams.ownerId
  );

  return (
    <SidebarProvider>
      <AppSidebar activePath="/custom-component" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopNavbar
            searchPlaceholder="Search layers, tools, properties, and exports..."
            items={[
              { label: "Overview", href: "/", icon: DashboardSquare01Icon },
              { label: "Users", href: "/users", icon: UserAccountIcon },
              {
                label: "Wiring Templates",
                href: "/wiring/templates",
                icon: ElectricPlugsIcon,
              },
              {
                label: "Custom Component",
                href: "/custom-component",
                icon: PaintBrush02Icon,
                active: true,
              },
            ]}
          />

          <CustomComponentContent initialTarget={initialTarget} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
