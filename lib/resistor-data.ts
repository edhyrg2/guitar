import { getPrismaClient } from "@/lib/prisma";
import { type ResistorRow } from "@/lib/resistor-types";

type PrismaResistorRecord = {
  id: string;
  valueOhm: number;
  valueLabel: string;
  wattage: string | null;
  tolerance: string | null;
  description: string | null;
  isActive: boolean;
};

export const seedResistorRows: ResistorRow[] = [
  {
    id: "seed-resistor-150k",
    valueOhm: 150000,
    valueLabel: "150K",
    wattage: "1/4W",
    tolerance: "5%",
    description: "Common treble bleed network value when paired with a small capacitor.",
    isActive: true,
  },
  {
    id: "seed-resistor-220k",
    valueOhm: 220000,
    valueLabel: "220K",
    wattage: "1/4W",
    tolerance: "5%",
    description: "Useful for bleed and loading adjustments in guitar circuits.",
    isActive: true,
  },
  {
    id: "seed-resistor-470k",
    valueOhm: 470000,
    valueLabel: "470K",
    wattage: "1/4W",
    tolerance: "1%",
    description: "Often used to simulate loading or shape combined pickup behavior.",
    isActive: true,
  },
  {
    id: "seed-resistor-1m",
    valueOhm: 1000000,
    valueLabel: "1M",
    wattage: "1/4W",
    tolerance: "5%",
    description: "High value resistor for specialty mods and bleed circuits.",
    isActive: false,
  },
];

function mapRecord(record: PrismaResistorRecord): ResistorRow {
  return {
    id: record.id,
    valueOhm: record.valueOhm,
    valueLabel: record.valueLabel,
    wattage: record.wattage,
    tolerance: record.tolerance,
    description: record.description,
    isActive: record.isActive,
  };
}

export async function getResistorRows(): Promise<ResistorRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedResistorRows;
    }

    const resistors = (await prisma.resistor.findMany({
      orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }],
      select: {
        id: true,
        valueOhm: true,
        valueLabel: true,
        wattage: true,
        tolerance: true,
        description: true,
        isActive: true,
      },
    })) as PrismaResistorRecord[];

    return resistors.map(mapRecord);
  } catch {
    return seedResistorRows;
  }
}
