import { getPrismaClient } from "@/lib/prisma";
import { type WireTypeRow } from "@/lib/wire-type-types";

type PrismaWireTypeRecord = {
  id: string;
  name: string;
  color: string | null;
  hexColor: string | null;
  wireFunction: string | null;
  isShielded: boolean;
  isGround: boolean;
  description: string | null;
};

export const seedWireTypeRows: WireTypeRow[] = [
  {
    id: "seed-wire-hot-white",
    name: "Hot Lead White",
    color: "White",
    hexColor: "#F5F5F5",
    wireFunction: "Hot",
    isShielded: false,
    isGround: false,
    description: "Common hot lead used for pickup output in many wiring schemes.",
  },
  {
    id: "seed-wire-ground-black",
    name: "Ground Black",
    color: "Black",
    hexColor: "#111111",
    wireFunction: "Ground",
    isShielded: false,
    isGround: true,
    description: "Standard ground wire for backs of pots and common returns.",
  },
  {
    id: "seed-wire-shield-bare",
    name: "Shield Bare",
    color: "Bare",
    hexColor: "#B7B7B7",
    wireFunction: "Shield",
    isShielded: true,
    isGround: true,
    description: "Uninsulated braided or drain shield connected to ground.",
  },
  {
    id: "seed-wire-battery-red",
    name: "Battery Positive Red",
    color: "Red",
    hexColor: "#D62828",
    wireFunction: "Battery Positive",
    isShielded: false,
    isGround: false,
    description: "Power lead for active circuits and onboard preamps.",
  },
];

function mapRecord(record: PrismaWireTypeRecord): WireTypeRow {
  return {
    id: record.id,
    name: record.name,
    color: record.color,
    hexColor: record.hexColor,
    wireFunction: record.wireFunction,
    isShielded: record.isShielded,
    isGround: record.isGround,
    description: record.description,
  };
}

export async function getWireTypeRows(): Promise<WireTypeRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWireTypeRows;
    }

    const wireTypes = (await prisma.wireType.findMany({
      orderBy: [{ wireFunction: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        color: true,
        hexColor: true,
        wireFunction: true,
        isShielded: true,
        isGround: true,
        description: true,
      },
    })) as PrismaWireTypeRecord[];

    return wireTypes.map(mapRecord);
  } catch {
    return seedWireTypeRows;
  }
}
