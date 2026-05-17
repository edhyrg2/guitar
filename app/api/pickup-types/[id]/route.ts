import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/pickup-types/[id]">
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
    coilCount?: string | null;
    isActive?: boolean;
    description?: string | null;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const pickupType = await prisma.pickupType.update({
    where: { id },
    data: {
      name,
      slug: body.slug?.trim() || null,
      coilCount: body.coilCount?.trim() || null,
      isActive: body.isActive ?? true,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(pickupType);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/pickup-types/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.pickupType.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
