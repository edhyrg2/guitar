import { getPrismaClient } from "@/lib/prisma";
import { type ComponentAssetRow } from "@/lib/component-asset-types";

type PrismaComponentAssetRecord = {
  id: string;
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

export const seedComponentAssetRows: ComponentAssetRow[] = [
  {
    id: "seed-component-asset-switch-5-way",
    componentType: "Switch",
    name: "5-Way Blade Switch Top View",
    slug: "5-way-blade-switch-top-view",
    svgUrl: "/assets/components/switches/5-way-blade-top.svg",
    thumbnailUrl: "/assets/components/switches/5-way-blade-top-thumb.png",
    width: 320,
    height: 120,
    anchorPointsJson:
      '[{"key":"lug-1","x":32,"y":24},{"key":"lug-8","x":288,"y":96}]',
    styleType: "Realistic",
    isActive: true,
  },
  {
    id: "seed-component-asset-pot-250k",
    componentType: "Potentiometer",
    name: "250K Audio Pot Front",
    slug: "250k-audio-pot-front",
    svgUrl: "/assets/components/pots/250k-audio-front.svg",
    thumbnailUrl: "/assets/components/pots/250k-audio-front-thumb.png",
    width: 240,
    height: 240,
    anchorPointsJson:
      '[{"key":"lug-left","x":56,"y":188},{"key":"lug-center","x":120,"y":188},{"key":"lug-right","x":184,"y":188}]',
    styleType: "Illustrated",
    isActive: true,
  },
  {
    id: "seed-component-asset-jack-mono",
    componentType: "Output Jack",
    name: "Mono Output Jack Side View",
    slug: "mono-output-jack-side-view",
    svgUrl: "/assets/components/jacks/mono-side.svg",
    thumbnailUrl: null,
    width: 260,
    height: 200,
    anchorPointsJson: '[{"key":"tip","x":201,"y":66},{"key":"sleeve","x":96,"y":154}]',
    styleType: "Technical",
    isActive: true,
  },
  {
    id: "seed-component-asset-pickup-humbucker",
    componentType: "Pickup",
    name: "Humbucker Pickup Base",
    slug: "humbucker-pickup-base",
    svgUrl: "/assets/components/pickups/humbucker-base.svg",
    thumbnailUrl: "/assets/components/pickups/humbucker-base-thumb.png",
    width: 360,
    height: 140,
    anchorPointsJson: null,
    styleType: "Realistic",
    isActive: false,
  },
];

function mapRecord(record: PrismaComponentAssetRecord): ComponentAssetRow {
  return {
    id: record.id,
    componentType: record.componentType,
    name: record.name,
    slug: record.slug,
    svgUrl: record.svgUrl,
    thumbnailUrl: record.thumbnailUrl,
    width: record.width,
    height: record.height,
    anchorPointsJson:
      record.anchorPointsJson === null || record.anchorPointsJson === undefined
        ? null
        : JSON.stringify(record.anchorPointsJson),
    styleType: record.styleType,
    isActive: record.isActive,
  };
}

export async function getComponentAssetRows(): Promise<ComponentAssetRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedComponentAssetRows;
    }

    const componentAssets = (await prisma.componentAsset.findMany({
      orderBy: [{ isActive: "desc" }, { componentType: "asc" }, { name: "asc" }],
      select: {
        id: true,
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
    })) as PrismaComponentAssetRecord[];

    return componentAssets.map(mapRecord);
  } catch {
    return seedComponentAssetRows;
  }
}
