import { getPrismaClient } from "@/lib/prisma";
import { type BrandRow } from "@/lib/brand-types";

type PrismaBrandRecord = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  website: string | null;
  type: string | null;
  country: string | null;
  active: boolean;
};

export const seedBrandRows: BrandRow[] = [
  {
    id: "seed-fender",
    name: "Fender",
    slug: "fender",
    logo: "F",
    website: "https://www.fender.com",
    type: "Electric Guitar",
    country: "United States",
    active: true,
  },
  {
    id: "seed-gibson",
    name: "Gibson",
    slug: "gibson",
    logo: "G",
    website: "https://www.gibson.com",
    type: "Electric Guitar",
    country: "United States",
    active: true,
  },
  {
    id: "seed-ibanez",
    name: "Ibanez",
    slug: "ibanez",
    logo: "I",
    website: "https://www.ibanez.com",
    type: "Electric Guitar",
    country: "Japan",
    active: true,
  },
  {
    id: "seed-gretsch",
    name: "Gretsch",
    slug: "gretsch",
    logo: "GR",
    website: null,
    type: "Hollow Body",
    country: "United States",
    active: false,
  },
];

function mapBrandRecord(brand: PrismaBrandRecord): BrandRow {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    website: brand.website,
    type: brand.type,
    country: brand.country,
    active: brand.active,
  };
}

export async function getBrandRows(): Promise<BrandRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedBrandRows;
    }

    const brands = (await prisma.brand.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        website: true,
        type: true,
        country: true,
        active: true,
      },
    })) as PrismaBrandRecord[];

    return brands.map(mapBrandRecord);
  } catch {
    return seedBrandRows;
  }
}
