import { getPrismaClient } from "@/lib/prisma";
import {
  type WiringTemplateReference,
  type WiringTemplateRow,
} from "@/lib/wiring-template-types";

type PrismaWiringTemplateRecord = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string | null;
  diagramJson: unknown;
  switchLogicJson: unknown;
  isVerified: boolean;
  sourceType: string | null;
  sourceUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  pickupConfiguration: { name: string };
  switchType: { name: string };
};

export const seedWiringTemplateRows: WiringTemplateRow[] = [
  {
    id: "seed-wiring-template-strat-sss",
    name: "Strat Standard SSS 5-Way",
    slug: "strat-standard-sss-5-way",
    description: "Classic strat layout with master volume and two tone controls.",
    thumbnailUrl: null,
    pickupConfigurationId: "seed-sss",
    pickupConfigurationName: "Three Single Coil",
    switchTypeId: "seed-5-way-blade",
    switchTypeName: "5-Way Blade Switch",
    volumeCount: 1,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson:
      '{"components":[{"id":"switch","type":"switch","ref":"5-way-blade-switch"},{"id":"volume","type":"pot","role":"volume"}],"wires":[{"from":"neck.hot","to":"switch.lug1","color":"white"},{"from":"volume.output","to":"jack.tip","color":"white"}]}',
    switchLogicJson:
      '{"positions":[{"index":1,"label":"Bridge"},{"index":2,"label":"Bridge + Middle"},{"index":3,"label":"Middle"},{"index":4,"label":"Middle + Neck"},{"index":5,"label":"Neck"}]}',
    isVerified: true,
    sourceType: "Reference",
    sourceUrl: "https://example.com/strat-standard-sss-5-way",
    createdBy: "System Seed",
    createdAt: new Date("2026-05-17T13:10:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-17T13:10:00.000Z").toISOString(),
  },
  {
    id: "seed-wiring-template-les-paul-hh",
    name: "Les Paul HH 3-Way",
    slug: "les-paul-hh-3-way",
    description: "Traditional dual-humbucker wiring with two volume and two tone controls.",
    thumbnailUrl: null,
    pickupConfigurationId: "seed-hh",
    pickupConfigurationName: "Dual Humbucker",
    switchTypeId: "seed-3-way-toggle",
    switchTypeName: "3-Way Toggle Switch",
    volumeCount: 2,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson:
      '{"components":[{"id":"toggle","type":"switch","ref":"3-way-toggle-switch"},{"id":"neck-volume","type":"pot","role":"volume"}],"wires":[{"from":"neck.hot","to":"toggle.neck","color":"white"},{"from":"bridge.hot","to":"toggle.bridge","color":"white"}]}',
    switchLogicJson:
      '{"positions":[{"index":1,"label":"Neck"},{"index":2,"label":"Neck + Bridge"},{"index":3,"label":"Bridge"}]}',
    isVerified: false,
    sourceType: "Imported",
    sourceUrl: "https://example.com/les-paul-hh-3-way",
    createdBy: "System Seed",
    createdAt: new Date("2026-05-17T13:12:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-17T13:12:00.000Z").toISOString(),
  },
];

export const seedWiringTemplatePickupConfigurationOptions: WiringTemplateReference[] = [
  { id: "seed-sss", name: "Three Single Coil" },
  { id: "seed-hh", name: "Dual Humbucker" },
  { id: "seed-hsh", name: "Humbucker Single Humbucker" },
  { id: "seed-ss", name: "Dual Single Coil" },
];

export const seedWiringTemplateSwitchTypeOptions: WiringTemplateReference[] = [
  { id: "seed-5-way-blade", name: "5-Way Blade Switch" },
  { id: "seed-3-way-toggle", name: "3-Way Toggle Switch" },
  { id: "seed-4-way-blade", name: "4-Way Blade Switch" },
  { id: "seed-dpdt-mini-toggle", name: "DPDT Mini Toggle" },
];

function mapRecord(record: PrismaWiringTemplateRecord): WiringTemplateRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    pickupConfigurationId: record.pickupConfigurationId,
    pickupConfigurationName: record.pickupConfiguration.name,
    switchTypeId: record.switchTypeId,
    switchTypeName: record.switchType.name,
    volumeCount: record.volumeCount,
    toneCount: record.toneCount,
    difficultyLevel: record.difficultyLevel,
    diagramJson: JSON.stringify(record.diagramJson),
    switchLogicJson: JSON.stringify(record.switchLogicJson),
    isVerified: record.isVerified,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getWiringTemplateRows(): Promise<WiringTemplateRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateRows;
    }

    const templates = (await prisma.wiringTemplate.findMany({
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      include: {
        pickupConfiguration: {
          select: { name: true },
        },
        switchType: {
          select: { name: true },
        },
      },
    })) as PrismaWiringTemplateRecord[];

    return templates.map(mapRecord);
  } catch {
    return seedWiringTemplateRows;
  }
}

export async function getWiringTemplatePickupConfigurationOptions(): Promise<
  WiringTemplateReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplatePickupConfigurationOptions;
    }

    return prisma.pickupConfiguration.findMany({
      orderBy: [{ pickupCount: "desc" }, { code: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplatePickupConfigurationOptions;
  }
}

export async function getWiringTemplateSwitchTypeOptions(): Promise<
  WiringTemplateReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateSwitchTypeOptions;
    }

    return prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateSwitchTypeOptions;
  }
}
