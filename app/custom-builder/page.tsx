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
import {
  getWiringTemplatePickupConfigurationOptions,
  getWiringTemplateSwitchTypeOptions,
} from "@/lib/wiring-template-data";

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

type NamedOwnerRecord = {
  id: string;
  ownerType?: string | null;
  ownerId?: string | null;
  name: string;
  componentType?: string | null;
  slug?: string | null;
  svgUrl?: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  anchorPointsJson?: unknown;
  styleType?: string | null;
  componentAssetId?: string | null;
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
  fallbackComponentType: string
) {
  return owners
    .filter((owner) => owner.isActive)
    .map((owner) => {
      const connectionPoints = parseAssetConnectionPoints(owner.anchorPointsJson);

      if (connectionPoints.length === 0) {
        return null;
      }

      return {
        id: `${ownerType}:${owner.id}`,
        componentAssetId: owner.componentAssetId ?? null,
        componentType: fallbackComponentType,
        name: owner.name,
        slug: owner.slug ?? null,
        width: owner.width ?? 220,
        height: owner.height ?? 140,
        previewUrl: owner.svgUrl ?? owner.thumbnailUrl ?? null,
        styleType: owner.styleType ?? null,
        connectionPoints,
      } satisfies BuilderAssetDefinition;
    })
    .filter((asset): asset is BuilderAssetDefinition => asset !== null);
}

function buildGenericBuilderAssets(assets: NamedOwnerRecord[]) {
  return assets
    .filter((asset) => asset.isActive)
    .map((asset) => {
      const connectionPoints = parseAssetConnectionPoints(asset.anchorPointsJson);

      if (connectionPoints.length === 0 || !asset.componentType?.trim()) {
        return null;
      }

      return {
        id: asset.id,
        componentAssetId: asset.id as string | null,
        componentType: asset.componentType!,
        name: asset.name,
        slug: asset.slug ?? null,
        width: asset.width ?? 220,
        height: asset.height ?? 140,
        previewUrl: asset.svgUrl ?? asset.thumbnailUrl ?? null,
        styleType: asset.styleType ?? null,
        connectionPoints,
      } satisfies BuilderAssetDefinition;
    })
    .filter((asset): asset is BuilderAssetDefinition => asset !== null);
}

function mergeBuilderAssets(...groups: BuilderAssetDefinition[][]) {
  const registry = new Map<string, BuilderAssetDefinition>();

  for (const group of groups) {
    for (const asset of group) {
      const key = asset.componentAssetId ?? asset.id;

      if (!registry.has(key)) {
        registry.set(key, asset);
      }
    }
  }

  return Array.from(registry.values());
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
    pickupModels,
    mods,
    genericAssets,
    pickupModelAssets,
  ] = await Promise.all([
    prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        svgAssetId: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        anchorPointsJson: true,
        styleType: true,
        isActive: true,
      },
    }),
    prisma.potType.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        anchorPointsJson: true,
        styleType: true,
        isActive: true,
      },
    }),
    prisma.capacitor.findMany({
      orderBy: [{ isActive: "desc" }, { valueFarads: "asc" }],
      select: {
        id: true,
        valueLabel: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        anchorPointsJson: true,
        styleType: true,
        isActive: true,
      },
    }),
    prisma.resistor.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }],
      select: {
        id: true,
        valueLabel: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        anchorPointsJson: true,
        styleType: true,
        isActive: true,
      },
    }),
    prisma.pickupModel.findMany({
      orderBy: [{ isActivePickup: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        positionType: true,
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
    }),
    prisma.mod.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
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
    prisma.componentAsset.findMany({
      where: {
        OR: [
          { ownerType: null },
          { ownerType: "pickup-type" },
          { ownerType: "output-jack" },
        ],
      },
      orderBy: [{ isActive: "desc" }, { componentType: "asc" }, { name: "asc" }],
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        name: true,
        componentType: true,
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
    prisma.componentAsset.findMany({
      where: {
        ownerType: "pickup-model",
      },
      orderBy: [{ isActive: "desc" }, { componentType: "asc" }, { name: "asc" }],
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        name: true,
        componentType: true,
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

  const pickupModelAssetMap = new Map(
    pickupModelAssets
      .filter((asset) => asset.ownerType === "pickup-model" && asset.ownerId)
      .map((asset) => [asset.ownerId!, asset])
  );

  return mergeBuilderAssets(
    buildBuilderAssets(
      switchTypes.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        componentAssetId: item.svgAssetId,
        isActive: item.isActive,
      })),
      "switch-type",
      "Switch"
    ),
    buildBuilderAssets(
      potTypes.map((item) => ({
        id: item.id,
        name: item.name,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        isActive: item.isActive,
      })),
      "pot-type",
      "Potentiometer"
    ),
    buildBuilderAssets(
      capacitors.map((item) => ({
        id: item.id,
        name: item.valueLabel,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        isActive: item.isActive,
      })),
      "capacitor",
      "Capacitor"
    ),
    buildBuilderAssets(
      resistors.map((item) => ({
        id: item.id,
        name: item.valueLabel,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        isActive: item.isActive,
      })),
      "resistor",
      "Resistor"
    ),
    buildBuilderAssets(
      pickupModels.map((item) => {
        const asset = pickupModelAssetMap.get(item.id);

        return {
          id: item.id,
          name: `${item.pickupBrand.name} ${item.name}`,
          componentType: "Pickup",
          slug: item.slug,
          svgUrl: asset?.svgUrl,
          thumbnailUrl: asset?.thumbnailUrl,
          width: asset?.width,
          height: asset?.height,
          anchorPointsJson: asset?.anchorPointsJson,
          styleType: asset?.styleType,
          componentAssetId: asset?.id ?? null,
          isActive: item.isActivePickup,
        };
      }),
      "pickup-model",
      "Pickup"
    ),
    buildBuilderAssets(
      mods.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        isActive: item.isActive,
      })),
      "mod",
      "Accessory / Mod"
    ),
    buildGenericBuilderAssets(
      genericAssets
        .map((item) => ({
        id: item.id,
        name: item.name,
        componentType: item.componentType,
        slug: item.slug,
        svgUrl: item.svgUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        anchorPointsJson: item.anchorPointsJson,
        styleType: item.styleType,
        isActive: item.isActive,
      }))
    )
  );
}

type CustomBuilderPageProps = {
  searchParams?: Promise<{
    savedSetupId?: string;
  }>;
};

export default async function CustomBuilderPage({
  searchParams,
}: CustomBuilderPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialSavedSetupId = resolvedSearchParams.savedSetupId?.trim() || null;
  const [builderAssets, wireTypes, pickupConfigurationOptions, switchTypeOptions] = await Promise.all([
    getBuilderAssets(),
    getWireTypeRows(),
    getWiringTemplatePickupConfigurationOptions(),
    getWiringTemplateSwitchTypeOptions(),
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

          <CustomBuilderContent
            assets={builderAssets}
            wireTypes={wireTypes}
            pickupConfigurationOptions={pickupConfigurationOptions}
            switchTypeOptions={switchTypeOptions}
            initialSavedSetupId={initialSavedSetupId}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
