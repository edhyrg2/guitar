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

export async function PUT(
  request: Request,
  context: RouteContext<"/api/guitar-brands/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
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

  const guitarBrand = await prisma.guitarBrand.update({
    where: { id },
    data: {
      name,
      slug: body.slug?.trim() || null,
      logoUrl: body.logoUrl?.trim() || null,
      country: body.country?.trim() || null,
      website: body.website?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(mapGuitarBrandResponse(guitarBrand));
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/guitar-brands/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.guitarBrand.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
