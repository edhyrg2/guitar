import { getPrismaClient } from "@/lib/prisma";
import { type GuitarBrandRow } from "@/lib/guitar-brand-types";

type PrismaGuitarBrandRecord = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const seedGuitarBrandRows: GuitarBrandRow[] = [
  {
    id: "seed-guitar-fender",
    name: "Fender",
    slug: "fender",
    logoUrl: "https://logo.clearbit.com/fender.com",
    country: "United States",
    website: "https://www.fender.com",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-guitar-gibson",
    name: "Gibson",
    slug: "gibson",
    logoUrl: "https://logo.clearbit.com/gibson.com",
    country: "United States",
    website: "https://www.gibson.com",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-guitar-ibanez",
    name: "Ibanez",
    slug: "ibanez",
    logoUrl: "https://logo.clearbit.com/ibanez.com",
    country: "Japan",
    website: "https://www.ibanez.com",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-guitar-prs",
    name: "PRS",
    slug: "prs",
    logoUrl: null,
    country: "United States",
    website: "https://prsguitars.com",
    isActive: false,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
];

function mapGuitarBrandRecord(record: PrismaGuitarBrandRecord): GuitarBrandRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    logoUrl: record.logoUrl,
    country: record.country,
    website: record.website,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getGuitarBrandRows(): Promise<GuitarBrandRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedGuitarBrandRows;
    }

    const guitarBrands = (await prisma.guitarBrand.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        country: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as PrismaGuitarBrandRecord[];

    return guitarBrands.map(mapGuitarBrandRecord);
  } catch {
    return seedGuitarBrandRows;
  }
}
