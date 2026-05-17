import { getPrismaClient } from "@/lib/prisma";
import { seedBrandRows } from "@/lib/brand-data";
import { seedPickupTypeRows } from "@/lib/pickup-type-data";
import { type PickupModelReference, type PickupModelRow } from "@/lib/pickup-model-types";

type PrismaPickupModelRecord = {
  id: string;
  pickupBrandId: string;
  pickupTypeId: string;
  name: string;
  slug: string | null;
  positionType: string | null;
  wireCount: string | null;
  magnetType: string | null;
  dcResistance: string | null;
  outputLevel: string | null;
  isActivePickup: boolean;
  colorCodeSchemaId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  pickupBrand: { name: string };
  pickupType: { name: string };
};

export const seedPickupModelRows: PickupModelRow[] = [
  {
    id: "seed-fender-custom-shop-69",
    pickupBrandId: "seed-fender",
    pickupTypeId: "seed-single-coil",
    pickupBrandName: "Fender",
    pickupTypeName: "Vintage Strat",
    name: "Custom Shop '69 Strat Set",
    slug: "custom-shop-69-strat-set",
    positionType: "Neck / Middle / Bridge",
    wireCount: "2 Conductor",
    magnetType: "Alnico 5",
    dcResistance: "5.8k",
    outputLevel: "Vintage",
    isActivePickup: true,
    colorCodeSchemaId: null,
    description: "Classic low-output strat pickup set with bright top end.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-gibson-57-classic",
    pickupBrandId: "seed-gibson",
    pickupTypeId: "seed-humbucker",
    pickupBrandName: "Gibson",
    pickupTypeName: "Modern Output",
    name: "'57 Classic",
    slug: "57-classic",
    positionType: "Neck / Bridge",
    wireCount: "2 Conductor",
    magnetType: "Alnico 2",
    dcResistance: "7.6k",
    outputLevel: "Medium",
    isActivePickup: true,
    colorCodeSchemaId: null,
    description: "PAF-inspired humbucker with warm mids and smooth highs.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-seymour-duncan-hot-rails",
    pickupBrandId: "seed-gretsch",
    pickupTypeId: "seed-p90",
    pickupBrandName: "Gretsch",
    pickupTypeName: "Soapbar Classic",
    name: "Hot Rails Style Prototype",
    slug: "hot-rails-style-prototype",
    positionType: "Bridge",
    wireCount: "4 Conductor",
    magnetType: "Ceramic",
    dcResistance: "16.9k",
    outputLevel: "High",
    isActivePickup: false,
    colorCodeSchemaId: "sd-4-wire",
    description: "Prototype entry for compact high-output bridge replacements.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
];

function mapPickupModelRecord(record: PrismaPickupModelRecord): PickupModelRow {
  return {
    id: record.id,
    pickupBrandId: record.pickupBrandId,
    pickupTypeId: record.pickupTypeId,
    pickupBrandName: record.pickupBrand.name,
    pickupTypeName: record.pickupType.name,
    name: record.name,
    slug: record.slug,
    positionType: record.positionType,
    wireCount: record.wireCount,
    magnetType: record.magnetType,
    dcResistance: record.dcResistance,
    outputLevel: record.outputLevel,
    isActivePickup: record.isActivePickup,
    colorCodeSchemaId: record.colorCodeSchemaId,
    description: record.description,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPickupModelRows(): Promise<PickupModelRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedPickupModelRows;
    }

    const pickupModels = (await prisma.pickupModel.findMany({
      orderBy: [{ isActivePickup: "desc" }, { name: "asc" }],
      select: {
        id: true,
        pickupBrandId: true,
        pickupTypeId: true,
        name: true,
        slug: true,
        positionType: true,
        wireCount: true,
        magnetType: true,
        dcResistance: true,
        outputLevel: true,
        isActivePickup: true,
        colorCodeSchemaId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        pickupBrand: {
          select: {
            name: true,
          },
        },
        pickupType: {
          select: {
            name: true,
          },
        },
      },
    })) as PrismaPickupModelRecord[];

    return pickupModels.map(mapPickupModelRecord);
  } catch {
    return seedPickupModelRows;
  }
}

export async function getPickupModelReferences(): Promise<{
  brands: PickupModelReference[];
  pickupTypes: PickupModelReference[];
}> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        brands: seedBrandRows.map(({ id, name }) => ({ id, name })),
        pickupTypes: seedPickupTypeRows.map(({ id, name }) => ({ id, name })),
      };
    }

    const [brands, pickupTypes] = await Promise.all([
      prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.pickupType.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return { brands, pickupTypes };
  } catch {
    return {
      brands: seedBrandRows.map(({ id, name }) => ({ id, name })),
      pickupTypes: seedPickupTypeRows.map(({ id, name }) => ({ id, name })),
    };
  }
}
