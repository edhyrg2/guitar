import { getPrismaClient } from "@/lib/prisma";
import { type CapacitorRow } from "@/lib/capacitor-types";

type PrismaCapacitorRecord = {
  id: string;
  valueFarads: number;
  valueLabel: string;
  type: string | null;
  voltageRating: string | null;
  description: string | null;
  isActive: boolean;
};

export const seedCapacitorRows: CapacitorRow[] = [
  {
    id: "seed-cap-022uf-poly",
    valueFarads: 0.000000022,
    valueLabel: "0.022uF",
    type: "Poly Film",
    voltageRating: "400V",
    description: "Popular tone capacitor value for humbucker circuits.",
    isActive: true,
  },
  {
    id: "seed-cap-047uf-poly",
    valueFarads: 0.000000047,
    valueLabel: "0.047uF",
    type: "Poly Film",
    voltageRating: "400V",
    description: "Common tone capacitor value for single-coil circuits.",
    isActive: true,
  },
  {
    id: "seed-cap-015uf-paper",
    valueFarads: 0.000000015,
    valueLabel: "0.015uF",
    type: "Paper In Oil",
    voltageRating: "200V",
    description: "Brighter roll-off option often used on neck humbuckers.",
    isActive: true,
  },
  {
    id: "seed-cap-001uf-ceramic",
    valueFarads: 0.000000001,
    valueLabel: "0.001uF",
    type: "Ceramic",
    voltageRating: "50V",
    description: "Small cap value useful for treble bleed networks and special mods.",
    isActive: false,
  },
];

function mapRecord(record: PrismaCapacitorRecord): CapacitorRow {
  return {
    id: record.id,
    valueFarads: record.valueFarads,
    valueLabel: record.valueLabel,
    type: record.type,
    voltageRating: record.voltageRating,
    description: record.description,
    isActive: record.isActive,
  };
}

export async function getCapacitorRows(): Promise<CapacitorRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedCapacitorRows;
    }

    const capacitors = (await prisma.capacitor.findMany({
      orderBy: [{ isActive: "desc" }, { valueFarads: "asc" }],
      select: {
        id: true,
        valueFarads: true,
        valueLabel: true,
        type: true,
        voltageRating: true,
        description: true,
        isActive: true,
      },
    })) as PrismaCapacitorRecord[];

    return capacitors.map(mapRecord);
  } catch {
    return seedCapacitorRows;
  }
}
