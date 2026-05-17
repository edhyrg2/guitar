import { getPrismaClient } from "@/lib/prisma";
import {
  type WiringTemplateComponentReference,
  type WiringTemplateComponentRow,
} from "@/lib/wiring-template-component-types";

type PrismaWiringTemplateComponentRecord = {
  id: string;
  wiringTemplateId: string;
  componentRole: string;
  componentType: string;
  assetId: string;
  positionX: number;
  positionY: number;
  rotation: number;
  metadataJson: unknown;
  wiringTemplate: { name: string };
  asset: { name: string };
};

export const seedWiringTemplateComponentRows: WiringTemplateComponentRow[] = [
  {
    id: "seed-template-component-strat-switch",
    wiringTemplateId: "seed-wiring-template-strat-sss",
    wiringTemplateName: "Strat Standard SSS 5-Way",
    componentRole: "Switch",
    componentType: "Switch",
    assetId: "seed-component-asset-switch-5-way",
    assetName: "5-Way Blade Switch Top View",
    positionX: 428,
    positionY: 126,
    rotation: 0,
    metadataJson: '{"label":"5-Way Blade Switch","layer":"controls"}',
  },
  {
    id: "seed-template-component-strat-volume",
    wiringTemplateId: "seed-wiring-template-strat-sss",
    wiringTemplateName: "Strat Standard SSS 5-Way",
    componentRole: "Volume",
    componentType: "Potentiometer",
    assetId: "seed-component-asset-pot-250k",
    assetName: "250K Audio Pot Front",
    positionX: 612,
    positionY: 298,
    rotation: 0,
    metadataJson: '{"label":"Master Volume","layer":"controls"}',
  },
  {
    id: "seed-template-component-les-paul-selector",
    wiringTemplateId: "seed-wiring-template-les-paul-hh",
    wiringTemplateName: "Les Paul HH 3-Way",
    componentRole: "Selector",
    componentType: "Switch",
    assetId: "seed-component-asset-switch-5-way",
    assetName: "5-Way Blade Switch Top View",
    positionX: 188,
    positionY: 92,
    rotation: 90,
    metadataJson:
      '{"label":"3-Way Selector Placement Placeholder","layer":"controls"}',
  },
];

export const seedWiringTemplateComponentTemplateOptions: WiringTemplateComponentReference[] =
  [
    { id: "seed-wiring-template-strat-sss", name: "Strat Standard SSS 5-Way" },
    { id: "seed-wiring-template-les-paul-hh", name: "Les Paul HH 3-Way" },
  ];

export const seedWiringTemplateComponentAssetOptions: WiringTemplateComponentReference[] =
  [
    { id: "seed-component-asset-switch-5-way", name: "5-Way Blade Switch Top View" },
    { id: "seed-component-asset-pot-250k", name: "250K Audio Pot Front" },
    { id: "seed-component-asset-jack-mono", name: "Mono Output Jack Side View" },
    { id: "seed-component-asset-pickup-humbucker", name: "Humbucker Pickup Base" },
  ];

function mapRecord(
  record: PrismaWiringTemplateComponentRecord
): WiringTemplateComponentRow {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    componentRole: record.componentRole,
    componentType: record.componentType,
    assetId: record.assetId,
    assetName: record.asset.name,
    positionX: record.positionX,
    positionY: record.positionY,
    rotation: record.rotation,
    metadataJson:
      record.metadataJson === null || record.metadataJson === undefined
        ? null
        : JSON.stringify(record.metadataJson),
  };
}

export async function getWiringTemplateComponentRows(): Promise<
  WiringTemplateComponentRow[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateComponentRows;
    }

    const components = (await prisma.wiringTemplateComponent.findMany({
      orderBy: [
        { wiringTemplate: { name: "asc" } },
        { componentRole: "asc" },
        { componentType: "asc" },
      ],
      include: {
        wiringTemplate: {
          select: { name: true },
        },
        asset: {
          select: { name: true },
        },
      },
    })) as PrismaWiringTemplateComponentRecord[];

    return components.map(mapRecord);
  } catch {
    return seedWiringTemplateComponentRows;
  }
}

export async function getWiringTemplateComponentTemplateOptions(): Promise<
  WiringTemplateComponentReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateComponentTemplateOptions;
    }

    return prisma.wiringTemplate.findMany({
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateComponentTemplateOptions;
  }
}

export async function getWiringTemplateComponentAssetOptions(): Promise<
  WiringTemplateComponentReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateComponentAssetOptions;
    }

    return prisma.componentAsset.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateComponentAssetOptions;
  }
}
