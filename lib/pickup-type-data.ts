import { getPrismaClient } from "@/lib/prisma";
import { type PickupTypeRow } from "@/lib/pickup-type-types";

type PrismaPickupTypeRecord = {
  id: string;
  name: string;
  slug: string | null;
  coilCount: string | null;
  isActive: boolean;
  description: string | null;
};

export const seedPickupTypeRows: PickupTypeRow[] = [
  {
    id: "seed-single-coil",
    name: "Vintage Strat",
    slug: "vintage-strat",
    coilCount: "Single Coil",
    isActive: true,
    description: "Traditional bright single coil voice for strat-style setups.",
  },
  {
    id: "seed-humbucker",
    name: "Modern Output",
    slug: "modern-output",
    coilCount: "Humbucker",
    isActive: true,
    description: "Full-size humbucker used for higher output and reduced noise.",
  },
  {
    id: "seed-p90",
    name: "Soapbar Classic",
    slug: "soapbar-classic",
    coilCount: "P90",
    isActive: true,
    description: "Mid-forward single-coil style pickup with wider bobbin response.",
  },
  {
    id: "seed-piezo",
    name: "Bridge Piezo",
    slug: "bridge-piezo",
    coilCount: "Piezo",
    isActive: false,
    description: "Used for acoustic-like bridge transducer systems.",
  },
];

function mapPickupTypeRecord(record: PrismaPickupTypeRecord): PickupTypeRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    coilCount: record.coilCount,
    isActive: record.isActive,
    description: record.description,
  };
}

export async function getPickupTypeRows(): Promise<PickupTypeRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedPickupTypeRows;
    }

    const pickupTypes = (await prisma.pickupType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        coilCount: true,
        isActive: true,
        description: true,
      },
    })) as PrismaPickupTypeRecord[];

    return pickupTypes.map(mapPickupTypeRecord);
  } catch {
    return seedPickupTypeRows;
  }
}
