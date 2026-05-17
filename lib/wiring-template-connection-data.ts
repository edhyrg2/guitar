import { getPrismaClient } from "@/lib/prisma";
import {
  type WiringTemplateConnectionReference,
  type WiringTemplateConnectionRow,
} from "@/lib/wiring-template-connection-types";

type PrismaWiringTemplateConnectionRecord = {
  id: string;
  wiringTemplateId: string;
  fromComponentRole: string;
  fromPointKey: string;
  toComponentRole: string;
  toPointKey: string;
  wireTypeId: string;
  wireColor: string | null;
  pathJson: unknown;
  label: string | null;
  notes: string | null;
  wiringTemplate: { name: string };
  wireType: { name: string };
};

export const seedWiringTemplateConnectionRows: WiringTemplateConnectionRow[] = [
  {
    id: "seed-template-connection-strat-switch-volume",
    wiringTemplateId: "seed-wiring-template-strat-sss",
    wiringTemplateName: "Strat Standard SSS 5-Way",
    fromComponentRole: "Switch",
    fromPointKey: "lug-1",
    toComponentRole: "Volume",
    toPointKey: "input",
    wireTypeId: "seed-wire-hot-white",
    wireTypeName: "Hot Lead White",
    wireColor: "White",
    pathJson:
      '{"points":[{"x":428,"y":126},{"x":520,"y":180},{"x":612,"y":298}]}',
    label: "Switch to Volume",
    notes: "Primary hot signal path from selector to master volume.",
  },
  {
    id: "seed-template-connection-les-paul-selector-out",
    wiringTemplateId: "seed-wiring-template-les-paul-hh",
    wiringTemplateName: "Les Paul HH 3-Way",
    fromComponentRole: "Selector",
    fromPointKey: "output",
    toComponentRole: "Volume",
    toPointKey: "input",
    wireTypeId: "seed-wire-hot-white",
    wireTypeName: "Hot Lead White",
    wireColor: "White",
    pathJson:
      '{"points":[{"x":188,"y":92},{"x":260,"y":168},{"x":344,"y":244}]}',
    label: "Selector Out",
    notes: "Routes selected pickup signal to the volume control.",
  },
];

export const seedWiringTemplateConnectionTemplateOptions: WiringTemplateConnectionReference[] =
  [
    { id: "seed-wiring-template-strat-sss", name: "Strat Standard SSS 5-Way" },
    { id: "seed-wiring-template-les-paul-hh", name: "Les Paul HH 3-Way" },
  ];

export const seedWiringTemplateConnectionWireTypeOptions: WiringTemplateConnectionReference[] =
  [
    { id: "seed-wire-hot-white", name: "Hot Lead White" },
    { id: "seed-wire-ground-black", name: "Ground Black" },
    { id: "seed-wire-shield-bare", name: "Shield Bare" },
    { id: "seed-wire-battery-red", name: "Battery Positive Red" },
  ];

function mapRecord(
  record: PrismaWiringTemplateConnectionRecord
): WiringTemplateConnectionRow {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    fromComponentRole: record.fromComponentRole,
    fromPointKey: record.fromPointKey,
    toComponentRole: record.toComponentRole,
    toPointKey: record.toPointKey,
    wireTypeId: record.wireTypeId,
    wireTypeName: record.wireType.name,
    wireColor: record.wireColor,
    pathJson:
      record.pathJson === null || record.pathJson === undefined
        ? null
        : JSON.stringify(record.pathJson),
    label: record.label,
    notes: record.notes,
  };
}

export async function getWiringTemplateConnectionRows(): Promise<
  WiringTemplateConnectionRow[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateConnectionRows;
    }

    const connections = (await prisma.wiringTemplateConnection.findMany({
      orderBy: [
        { wiringTemplate: { name: "asc" } },
        { fromComponentRole: "asc" },
        { toComponentRole: "asc" },
      ],
      include: {
        wiringTemplate: {
          select: { name: true },
        },
        wireType: {
          select: { name: true },
        },
      },
    })) as PrismaWiringTemplateConnectionRecord[];

    return connections.map(mapRecord);
  } catch {
    return seedWiringTemplateConnectionRows;
  }
}

export async function getWiringTemplateConnectionTemplateOptions(): Promise<
  WiringTemplateConnectionReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateConnectionTemplateOptions;
    }

    return prisma.wiringTemplate.findMany({
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateConnectionTemplateOptions;
  }
}

export async function getWiringTemplateConnectionWireTypeOptions(): Promise<
  WiringTemplateConnectionReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateConnectionWireTypeOptions;
    }

    return prisma.wireType.findMany({
      orderBy: [{ wireFunction: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateConnectionWireTypeOptions;
  }
}
