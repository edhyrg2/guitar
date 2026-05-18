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
import { getPrismaClient } from "@/lib/prisma";
import { getWireTypeRows } from "@/lib/wire-type-data";

type AssetAnchorPoint = {
  key?: string;
  pointKey?: string;
  label?: string;
  pointType?: string;
  color?: string | null;
  x?: number;
  y?: number;
  description?: string | null;
};

type OwnerAssetRecord = {
  id: string;
  ownerType: string | null;
  ownerId: string | null;
  componentType: string;
  name: string;
  slug: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  anchorPointsJson: unknown;
  styleType: string | null;
  isActive: boolean;
};

type NamedOwnerRecord = {
  id: string;
  name: string;
  slug?: string | null;
  isActive: boolean;
};

function parseAssetConnectionPoints(anchorPointsJson: unknown) {
  if (!anchorPointsJson) {
    return [];
  }

  try {
    const parsed =
      typeof anchorPointsJson === "string"
        ? (JSON.parse(anchorPointsJson) as AssetAnchorPoint[])
        : (anchorPointsJson as AssetAnchorPoint[]);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((point, index) => {
        const pointKey = (point.pointKey ?? point.key ?? "").trim();
        const label = (point.label ?? pointKey).trim();
        const pointType = (point.pointType ?? "Connection").trim();

        if (!pointKey || typeof point.x !== "number" || typeof point.y !== "number") {
          return null;
        }

        return {
          id: `anchor-${pointKey}-${index}`,
          pointKey,
          label: label || pointKey,
          pointType,
          color: point.color?.trim() || null,
          x: point.x,
          y: point.y,
          description: point.description?.trim() || null,
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null);
  } catch {
    return [];
  }
}

function buildBuilderAssets(
  owners: NamedOwnerRecord[],
  ownerType: string,
  fallbackComponentType: string,
  assetMap: Map<string, OwnerAssetRecord>
) {
  return owners
    .filter((owner) => owner.isActive)
    .map((owner) => {
      const asset = assetMap.get(`${ownerType}:${owner.id}`);

      if (!asset) {
        return null;
      }

      const connectionPoints = parseAssetConnectionPoints(asset.anchorPointsJson);

      if (connectionPoints.length === 0) {
        return null;
      }

      return {
        id: `${ownerType}:${owner.id}`,
        componentType: asset.componentType || fallbackComponentType,
        name: owner.name || asset.name,
        slug: owner.slug ?? asset.slug,
        width: asset.width ?? 220,
        height: asset.height ?? 140,
        previewUrl: asset.svgUrl ?? asset.thumbnailUrl,
        styleType: asset.styleType,
        connectionPoints,
      } satisfies BuilderAssetDefinition;
    })
    .filter((asset): asset is BuilderAssetDefinition => asset !== null);
}

async function getBuilderAssets(): Promise<BuilderAssetDefinition[]> {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return [];
  }

  const [
    switchTypes,
    potTypes,
    capacitors,
    resistors,
    pickupTypes,
    mods,
    ownedAssets,
  ] = await Promise.all([
    prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    prisma.potType.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
    prisma.capacitor.findMany({
      orderBy: [{ isActive: "desc" }, { valueFarads: "asc" }],
      select: { id: true, valueLabel: true, isActive: true },
    }),
    prisma.resistor.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }],
      select: { id: true, valueLabel: true, isActive: true },
    }),
    prisma.pickupType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    prisma.mod.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    prisma.componentAsset.findMany({
      where: {
        isActive: true,
        ownerType: {
          in: ["switch-type", "pot-type", "capacitor", "resistor", "pickup-type", "mod"],
        },
        ownerId: {
          not: null,
        },
      },
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        componentType: true,
        name: true,
        slug: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        anchorPointsJson: true,
        styleType: true,
        isActive: true,
      },
    }),
  ]);

  const assetMap = new Map(
    (ownedAssets as OwnerAssetRecord[])
      .filter((asset) => asset.ownerType && asset.ownerId)
      .map((asset) => [`${asset.ownerType}:${asset.ownerId}`, asset])
  );

  return [
    ...buildBuilderAssets(
      switchTypes.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
      })),
      "switch-type",
      "Switch",
      assetMap
    ),
    ...buildBuilderAssets(
      potTypes.map((item) => ({
        id: item.id,
        name: item.name,
        isActive: item.isActive,
      })),
      "pot-type",
      "Potentiometer",
      assetMap
    ),
    ...buildBuilderAssets(
      capacitors.map((item) => ({
        id: item.id,
        name: item.valueLabel,
        isActive: item.isActive,
      })),
      "capacitor",
      "Capacitor",
      assetMap
    ),
    ...buildBuilderAssets(
      resistors.map((item) => ({
        id: item.id,
        name: item.valueLabel,
        isActive: item.isActive,
      })),
      "resistor",
      "Resistor",
      assetMap
    ),
    ...buildBuilderAssets(
      pickupTypes.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
      })),
      "pickup-type",
      "Pickup",
      assetMap
    ),
    ...buildBuilderAssets(
      mods.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
      })),
      "mod",
      "Accessory / Mod",
      assetMap
    ),
  ];
}

export default async function CustomBuilderPage() {
  const [builderAssets, wireTypes] = await Promise.all([
    getBuilderAssets(),
    getWireTypeRows(),
  ]);

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
