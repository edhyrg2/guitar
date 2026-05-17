import { getPrismaClient } from "@/lib/prisma";
import { type PickupConfigurationRow } from "@/lib/pickup-configuration-types";

type PrismaPickupConfigurationRecord = {
  id: string;
  code: string;
  name: string;
  pickupCount: number;
  hasNeck: boolean;
  hasMiddle: boolean;
  hasBridge: boolean;
  description: string | null;
};

export const seedPickupConfigurationRows: PickupConfigurationRow[] = [
  {
    id: "seed-sss",
    code: "SSS",
    name: "Three Single Coil",
    pickupCount: 3,
    hasNeck: true,
    hasMiddle: true,
    hasBridge: true,
    description: "Classic three single-coil layout used on many Strat-style guitars.",
  },
  {
    id: "seed-hh",
    code: "HH",
    name: "Dual Humbucker",
    pickupCount: 2,
    hasNeck: true,
    hasMiddle: false,
    hasBridge: true,
    description: "Two humbuckers, typically neck and bridge positions.",
  },
  {
    id: "seed-hsh",
    code: "HSH",
    name: "Humbucker Single Humbucker",
    pickupCount: 3,
    hasNeck: true,
    hasMiddle: true,
    hasBridge: true,
    description: "Modern versatile layout with neck humbucker, middle single, bridge humbucker.",
  },
  {
    id: "seed-ss",
    code: "SS",
    name: "Dual Single Coil",
    pickupCount: 2,
    hasNeck: true,
    hasMiddle: false,
    hasBridge: true,
    description: "Simple two single-coil configuration for many offset and tele-style variants.",
  },
];

function mapRecord(record: PrismaPickupConfigurationRecord): PickupConfigurationRow {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    pickupCount: record.pickupCount,
    hasNeck: record.hasNeck,
    hasMiddle: record.hasMiddle,
    hasBridge: record.hasBridge,
    description: record.description,
  };
}

export async function getPickupConfigurationRows(): Promise<PickupConfigurationRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedPickupConfigurationRows;
    }

    const configurations = (await prisma.pickupConfiguration.findMany({
      orderBy: [{ pickupCount: "desc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        pickupCount: true,
        hasNeck: true,
        hasMiddle: true,
        hasBridge: true,
        description: true,
      },
    })) as PrismaPickupConfigurationRecord[];

    return configurations.map(mapRecord);
  } catch {
    return seedPickupConfigurationRows;
  }
}
