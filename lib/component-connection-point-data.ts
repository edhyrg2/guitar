import { getPrismaClient } from "@/lib/prisma";
import {
  type ComponentConnectionPointReference,
  type ComponentConnectionPointRow,
} from "@/lib/component-connection-point-types";

type PrismaComponentConnectionPointRecord = {
  id: string;
  componentAssetId: string;
  pointKey: string;
  label: string;
  pointType: string;
  x: number;
  y: number;
  description: string | null;
  componentAsset: { name: string };
};

type PrismaComponentConnectionPointReferenceRecord = {
  id: string;
  name: string;
  svgUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
};

export const seedComponentConnectionPointRows: ComponentConnectionPointRow[] = [
  {
    id: "seed-connection-point-switch-lug-1",
    componentAssetId: "seed-component-asset-switch-5-way",
    componentAssetName: "5-Way Blade Switch Top View",
    pointKey: "lug-1",
    label: "Lug 1",
    pointType: "Lug",
    x: 32,
    y: 24,
    description: "First terminal on the upper switch pole.",
  },
  {
    id: "seed-connection-point-switch-common-a",
    componentAssetId: "seed-component-asset-switch-5-way",
    componentAssetName: "5-Way Blade Switch Top View",
    pointKey: "common-a",
    label: "Common A",
    pointType: "Common",
    x: 164,
    y: 18,
    description: "Shared output terminal for the first pole.",
  },
  {
    id: "seed-connection-point-pot-lug-left",
    componentAssetId: "seed-component-asset-pot-250k",
    componentAssetName: "250K Audio Pot Front",
    pointKey: "lug-left",
    label: "Lug Left",
    pointType: "Lug",
    x: 56,
    y: 188,
    description: "Outer terminal commonly tied to ground or input depending on role.",
  },
  {
    id: "seed-connection-point-jack-tip",
    componentAssetId: "seed-component-asset-jack-mono",
    componentAssetName: "Mono Output Jack Side View",
    pointKey: "tip",
    label: "Tip",
    pointType: "Output",
    x: 201,
    y: 66,
    description: "Hot output terminal leading to the cable tip.",
  },
];

export const seedComponentConnectionPointReferences: ComponentConnectionPointReference[] = [
  {
    id: "seed-component-asset-switch-5-way",
    name: "5-Way Blade Switch Top View",
    imageUrl: "/assets/components/switches/5-way-blade-top.svg",
    width: 320,
    height: 120,
  },
  {
    id: "seed-component-asset-pot-250k",
    name: "250K Audio Pot Front",
    imageUrl: "/assets/components/pots/250k-audio-front.svg",
    width: 240,
    height: 240,
  },
  {
    id: "seed-component-asset-jack-mono",
    name: "Mono Output Jack Side View",
    imageUrl: "/assets/components/jacks/mono-side.svg",
    width: 260,
    height: 200,
  },
  {
    id: "seed-component-asset-pickup-humbucker",
    name: "Humbucker Pickup Base",
    imageUrl: "/assets/components/pickups/humbucker-base.svg",
    width: 360,
    height: 140,
  },
];

function mapRecord(
  record: PrismaComponentConnectionPointRecord
): ComponentConnectionPointRow {
  return {
    id: record.id,
    componentAssetId: record.componentAssetId,
    componentAssetName: record.componentAsset.name,
    pointKey: record.pointKey,
    label: record.label,
    pointType: record.pointType,
    x: record.x,
    y: record.y,
    description: record.description,
  };
}

export async function getComponentConnectionPointRows(): Promise<
  ComponentConnectionPointRow[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedComponentConnectionPointRows;
    }

    const points = (await prisma.componentConnectionPoint.findMany({
      orderBy: [
        { componentAsset: { name: "asc" } },
        { pointType: "asc" },
        { label: "asc" },
      ],
      include: {
        componentAsset: {
          select: { name: true },
        },
      },
    })) as PrismaComponentConnectionPointRecord[];

    return points.map(mapRecord);
  } catch {
    return seedComponentConnectionPointRows;
  }
}

export async function getComponentConnectionPointReferences(): Promise<
  ComponentConnectionPointReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedComponentConnectionPointReferences;
    }

    const componentAssets = await prisma.componentAsset.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        svgUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
      },
    });

    return (componentAssets as PrismaComponentConnectionPointReferenceRecord[]).map(
      (item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.svgUrl ?? item.thumbnailUrl,
        width: item.width,
        height: item.height,
      })
    );
  } catch {
    return seedComponentConnectionPointReferences;
  }
}
