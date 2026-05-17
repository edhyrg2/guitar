import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const brands = await prisma.brand.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(brands);
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
    logo?: string | null;
    website?: string | null;
    type?: string | null;
    country?: string | null;
    active?: boolean;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const brand = await prisma.brand.create({
    data: {
      name,
      slug: body.slug?.trim() || null,
      logo: body.logo?.trim() || null,
      website: body.website?.trim() || null,
      type: body.type?.trim() || null,
      country: body.country?.trim() || null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(brand, { status: 201 });
}
