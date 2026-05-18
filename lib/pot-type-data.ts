import { getPrismaClient } from "@/lib/prisma";
import { type PotTypeRow } from "@/lib/pot-type-types";

type PrismaPotTypeRecord = {
  id: string;
  name: string;
  valueOhm: number;
  valueLabel: string;
  taper: string | null;
  potFunction: string | null;
  isPushPull: boolean;
  isPushPush: boolean;
  isNoLoad: boolean;
  shaftType: string | null;
  description: string | null;
  isActive: boolean;
};

type PrismaOwnedAssetRecord = {
  ownerId: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
};

export const seedPotTypeRows: PotTypeRow[] = [
  {
    id: "seed-volume-250k-audio",
    name: "250K Audio Volume",
    previewUrl: "/assets/components/pots/250k-audio-front.svg",
    valueOhm: 250000,
    valueLabel: "250K",
    taper: "Audio",
    potFunction: "Volume",
    isPushPull: false,
    isPushPush: false,
    isNoLoad: false,
    shaftType: "Split Shaft",
    description: "Common volume pot for single-coil guitar circuits.",
    isActive: true,
  },
  {
    id: "seed-tone-500k-audio-push-pull",
    name: "500K Audio Tone Push Pull",
    previewUrl: null,
    valueOhm: 500000,
    valueLabel: "500K",
    taper: "Audio",
    potFunction: "Tone",
    isPushPull: true,
    isPushPush: false,
    isNoLoad: false,
    shaftType: "Long Split Shaft",
    description: "Tone pot with push-pull switch commonly used for coil splitting.",
    isActive: true,
  },
  {
    id: "seed-tone-250k-no-load",
    name: "250K No Load Tone",
    previewUrl: null,
    valueOhm: 250000,
    valueLabel: "250K",
    taper: "Audio",
    potFunction: "Tone",
    isPushPull: false,
    isPushPush: false,
    isNoLoad: true,
    shaftType: "Solid Shaft",
    description: "No-load tone pot that removes itself from the circuit at max setting.",
    isActive: true,
  },
  {
    id: "seed-blend-500k-linear-push-push",
    name: "500K Linear Blend Push Push",
    previewUrl: null,
    valueOhm: 500000,
    valueLabel: "500K",
    taper: "Linear",
    potFunction: "Blend",
    isPushPull: false,
    isPushPush: true,
    isNoLoad: false,
    shaftType: "Split Shaft",
    description: "Blend control with push-push switching for alternate routing.",
    isActive: false,
  },
];

function mapRecord(
  record: PrismaPotTypeRecord,
  previewUrl: string | null
): PotTypeRow {
  return {
    id: record.id,
    name: record.name,
    previewUrl,
    valueOhm: record.valueOhm,
    valueLabel: record.valueLabel,
    taper: record.taper,
    potFunction: record.potFunction,
    isPushPull: record.isPushPull,
    isPushPush: record.isPushPush,
    isNoLoad: record.isNoLoad,
    shaftType: record.shaftType,
    description: record.description,
    isActive: record.isActive,
  };
}

export async function getPotTypeRows(): Promise<PotTypeRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedPotTypeRows;
    }

    const potTypes = (await prisma.potType.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }, { name: "asc" }],
      select: {
        id: true,
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
    })) as PrismaPotTypeRecord[];

    const ownedAssets = (await prisma.componentAsset.findMany({
      where: {
        ownerType: "pot-type",
        ownerId: {
          in: potTypes.map((item) => item.id),
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

    return potTypes.map((item) => mapRecord(item, ownedAssetMap.get(item.id) ?? null));
  } catch {
    return seedPotTypeRows;
  }
}
