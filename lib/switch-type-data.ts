import { getPrismaClient } from "@/lib/prisma";
import { type SwitchTypeRow } from "@/lib/switch-type-types";

type PrismaSwitchTypeRecord = {
  id: string;
  name: string;
  slug: string | null;
  positionCount: number;
  poleCount: number;
  lugCount: number;
  switchCategory: string | null;
  description: string | null;
  svgAssetId: string | null;
  isActive: boolean;
};

type PrismaOwnedAssetRecord = {
  ownerId: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
};

export const seedSwitchTypeRows: SwitchTypeRow[] = [
  {
    id: "seed-5-way-blade",
    name: "5-Way Blade Switch",
    previewUrl: null,
    slug: "5-way-blade-switch",
    positionCount: 5,
    poleCount: 2,
    lugCount: 8,
    switchCategory: "Blade",
    description: "Common strat-style selector with five positions and dual poles.",
    svgAssetId: "switch-blade-5-way",
    isActive: true,
  },
  {
    id: "seed-3-way-toggle",
    name: "3-Way Toggle Switch",
    previewUrl: null,
    slug: "3-way-toggle-switch",
    positionCount: 3,
    poleCount: 2,
    lugCount: 3,
    switchCategory: "Toggle",
    description: "Les Paul style pickup selector for neck, both, and bridge.",
    svgAssetId: "switch-toggle-3-way",
    isActive: true,
  },
  {
    id: "seed-4-way-blade",
    name: "4-Way Blade Switch",
    previewUrl: null,
    slug: "4-way-blade-switch",
    positionCount: 4,
    poleCount: 2,
    lugCount: 8,
    switchCategory: "Blade",
    description: "Tele-style upgrade switch for adding series wiring options.",
    svgAssetId: "switch-blade-4-way",
    isActive: true,
  },
  {
    id: "seed-dpdt-mini-toggle",
    name: "DPDT Mini Toggle",
    previewUrl: null,
    slug: "dpdt-mini-toggle",
    positionCount: 2,
    poleCount: 2,
    lugCount: 6,
    switchCategory: "Mini Toggle",
    description: "Common DPDT on-on switch for coil split, phase, or series mods.",
    svgAssetId: "switch-mini-toggle-dpdt",
    isActive: false,
  },
];

function mapRecord(
  record: PrismaSwitchTypeRecord,
  previewUrl: string | null
): SwitchTypeRow {
  return {
    id: record.id,
    name: record.name,
    previewUrl,
    slug: record.slug,
    positionCount: record.positionCount,
    poleCount: record.poleCount,
    lugCount: record.lugCount,
    switchCategory: record.switchCategory,
    description: record.description,
    svgAssetId: record.svgAssetId,
    isActive: record.isActive,
  };
}

export async function getSwitchTypeRows(): Promise<SwitchTypeRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedSwitchTypeRows;
    }

    const switchTypes = (await prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        positionCount: true,
        poleCount: true,
        lugCount: true,
        switchCategory: true,
        description: true,
        svgAssetId: true,
        isActive: true,
      },
    })) as PrismaSwitchTypeRecord[];

    const ownedAssets = (await prisma.componentAsset.findMany({
      where: {
        ownerType: "switch-type",
        ownerId: {
          in: switchTypes.map((item) => item.id),
        },
      },
      select: {
        ownerId: true,
        svgUrl: true,
        thumbnailUrl: true,
      },
    })) as PrismaOwnedAssetRecord[];

    const ownedAssetMap = new Map(
      ownedAssets.map((item) => [item.ownerId, item.thumbnailUrl ?? item.svgUrl])
    );

    return switchTypes.map((item) => mapRecord(item, ownedAssetMap.get(item.id) ?? null));
  } catch {
    return seedSwitchTypeRows;
  }
}
