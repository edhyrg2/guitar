import { getPrismaClient } from "@/lib/prisma";
import { type ModRow } from "@/lib/mod-types";

type PrismaModRecord = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  requiresPushPull: boolean;
  requiresMiniToggle: boolean;
  requiresSpecialSwitch: boolean;
  difficultyLevel: string | null;
  isActive: boolean;
};

export const seedModRows: ModRow[] = [
  {
    id: "seed-mod-coil-split",
    name: "Coil Split Mod",
    slug: "coil-split-mod",
    description: "Lets a humbucker run as a single coil using a switching control.",
    requiresPushPull: true,
    requiresMiniToggle: false,
    requiresSpecialSwitch: false,
    difficultyLevel: "Intermediate",
    isActive: true,
  },
  {
    id: "seed-mod-series-parallel",
    name: "Series Parallel Mod",
    slug: "series-parallel-mod",
    description: "Switches a humbucker between series and parallel wiring modes.",
    requiresPushPull: true,
    requiresMiniToggle: true,
    requiresSpecialSwitch: false,
    difficultyLevel: "Advanced",
    isActive: true,
  },
  {
    id: "seed-mod-neck-on-switch",
    name: "Neck On Switch",
    slug: "neck-on-switch",
    description: "Adds the neck pickup into combinations not available on stock wiring.",
    requiresPushPull: false,
    requiresMiniToggle: true,
    requiresSpecialSwitch: false,
    difficultyLevel: "Intermediate",
    isActive: true,
  },
  {
    id: "seed-mod-phase-reverse",
    name: "Phase Reverse Mod",
    slug: "phase-reverse-mod",
    description: "Flips phase on one pickup for thin, nasal out-of-phase sounds.",
    requiresPushPull: false,
    requiresMiniToggle: false,
    requiresSpecialSwitch: true,
    difficultyLevel: "Advanced",
    isActive: false,
  },
];

function mapRecord(record: PrismaModRecord): ModRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    requiresPushPull: record.requiresPushPull,
    requiresMiniToggle: record.requiresMiniToggle,
    requiresSpecialSwitch: record.requiresSpecialSwitch,
    difficultyLevel: record.difficultyLevel,
    isActive: record.isActive,
  };
}

export async function getModRows(): Promise<ModRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedModRows;
    }

    const mods = (await prisma.mod.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        requiresPushPull: true,
        requiresMiniToggle: true,
        requiresSpecialSwitch: true,
        difficultyLevel: true,
        isActive: true,
      },
    })) as PrismaModRecord[];

    return mods.map(mapRecord);
  } catch {
    return seedModRows;
  }
}
