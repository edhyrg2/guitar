import { getPrismaClient } from "@/lib/prisma";
import { type OutputJackRow } from "@/lib/output-jack-types";

type PrismaOutputJackRecord = {
  id: string;
  name: string;
  slug: string | null;
  jackType: string | null;
  mountingStyle: string | null;
  conductorCount: number | null;
  description: string | null;
  isActive: boolean;
};

type PrismaOwnedAssetRecord = {
  ownerId: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
};

export const seedOutputJackRows: OutputJackRow[] = [
  {
    id: "seed-output-jack-mono-side",
    name: "Mono Output Jack Side Mount",
    previewUrl: "/assets/components/jacks/mono-side.svg",
    slug: "mono-output-jack-side-view",
    jackType: "Mono",
    mountingStyle: "Side Mount",
    conductorCount: 2,
    description: "Standard mono jack commonly used on side-mounted guitar bodies.",
    isActive: true,
  },
];

function mapRecord(
  record: PrismaOutputJackRecord,
  previewUrl: string | null
): OutputJackRow {
  return {
    id: record.id,
    name: record.name,
    previewUrl,
    slug: record.slug,
    jackType: record.jackType,
    mountingStyle: record.mountingStyle,
    conductorCount: record.conductorCount,
    description: record.description,
    isActive: record.isActive,
  };
}

export async function getOutputJackRows(): Promise<OutputJackRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedOutputJackRows;
    }

    const outputJacks = (await prisma.outputJack.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        jackType: true,
        mountingStyle: true,
        conductorCount: true,
        description: true,
        isActive: true,
      },
    })) as PrismaOutputJackRecord[];

    const ownedAssets = (await prisma.componentAsset.findMany({
      where: {
        ownerType: "output-jack",
        ownerId: {
          in: outputJacks.map((item) => item.id),
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

    return outputJacks.map((item) =>
      mapRecord(item, ownedAssetMap.get(item.id) ?? null)
    );
  } catch {
    return seedOutputJackRows;
  }
}
