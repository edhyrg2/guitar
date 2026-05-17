import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/brands/[id]">
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

  const brand = await prisma.brand.update({
    where: { id },
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

  return NextResponse.json(brand);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/brands/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.brand.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
