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

  const pickupTypes = await prisma.pickupType.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(pickupTypes);
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
    coilCount?: string | null;
    isActive?: boolean;
    description?: string | null;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const pickupType = await prisma.pickupType.create({
    data: {
      name,
      slug: body.slug?.trim() || null,
      coilCount: body.coilCount?.trim() || null,
      isActive: body.isActive ?? true,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(pickupType, { status: 201 });
}
