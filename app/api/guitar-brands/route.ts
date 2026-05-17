import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function mapGuitarBrandResponse(record: {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
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

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const guitarBrands = await prisma.guitarBrand.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(guitarBrands.map(mapGuitarBrandResponse));
}

export async function POST(request: Request) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    name?: string;
    slug?: string | null;
    logoUrl?: string | null;
    country?: string | null;
    website?: string | null;
    isActive?: boolean;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const guitarBrand = await prisma.guitarBrand.create({
    data: {
      name,
      slug: body.slug?.trim() || null,
      logoUrl: body.logoUrl?.trim() || null,
      country: body.country?.trim() || null,
      website: body.website?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(mapGuitarBrandResponse(guitarBrand), { status: 201 });
}
