import { getPrismaClient } from "@/lib/prisma";
import { seedGuitarBrandRows } from "@/lib/guitar-brand-data";
import { type GuitarModelReference, type GuitarModelRow } from "@/lib/guitar-model-types";

type PrismaGuitarModelRecord = {
  id: string;
  guitarBrandId: string;
  name: string;
  slug: string | null;
  series: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  bodyType: string | null;
  defaultPickupConfig: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  guitarBrand: { name: string };
};

export const seedGuitarModelRows: GuitarModelRow[] = [
  {
    id: "seed-stratocaster-american-professional-ii",
    guitarBrandId: "seed-guitar-fender",
    guitarBrandName: "Fender",
    name: "Stratocaster",
    slug: "stratocaster",
    series: "American Professional II",
    yearStart: 2020,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "SSS",
    description: "Modern strat platform with classic contours and updated appointments.",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-les-paul-standard-50s",
    guitarBrandId: "seed-guitar-gibson",
    guitarBrandName: "Gibson",
    name: "Les Paul Standard",
    slug: "les-paul-standard",
    series: "50s",
    yearStart: 2019,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "HH",
    description: "Traditional carved-top single cut with vintage-leaning electronics.",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-rg-prestige",
    guitarBrandId: "seed-guitar-ibanez",
    guitarBrandName: "Ibanez",
    name: "RG",
    slug: "rg",
    series: "Prestige",
    yearStart: 2003,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "HSH",
    description: "High-performance superstrat family with fast necks and modern switching.",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
];

function mapGuitarModelRecord(record: PrismaGuitarModelRecord): GuitarModelRow {
  return {
    id: record.id,
    guitarBrandId: record.guitarBrandId,
    guitarBrandName: record.guitarBrand.name,
    name: record.name,
    slug: record.slug,
    series: record.series,
    yearStart: record.yearStart,
    yearEnd: record.yearEnd,
    bodyType: record.bodyType,
    defaultPickupConfig: record.defaultPickupConfig,
    description: record.description,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getGuitarModelRows(): Promise<GuitarModelRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedGuitarModelRows;
    }

    const guitarModels = (await prisma.guitarModel.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        guitarBrandId: true,
        name: true,
        slug: true,
        series: true,
        yearStart: true,
        yearEnd: true,
        bodyType: true,
        defaultPickupConfig: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        guitarBrand: {
          select: {
            name: true,
          },
        },
      },
    })) as PrismaGuitarModelRecord[];

    return guitarModels.map(mapGuitarModelRecord);
  } catch {
    return seedGuitarModelRows;
  }
}

export async function getGuitarModelReferences(): Promise<{
  guitarBrands: GuitarModelReference[];
}> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        guitarBrands: seedGuitarBrandRows.map(({ id, name }) => ({ id, name })),
      };
    }

    const guitarBrands = await prisma.guitarBrand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { guitarBrands };
  } catch {
    return {
      guitarBrands: seedGuitarBrandRows.map(({ id, name }) => ({ id, name })),
    };
  }
}
