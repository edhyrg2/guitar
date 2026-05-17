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

  const switchTypes = await prisma.switchType.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(switchTypes);
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
    positionCount?: number;
    poleCount?: number;
    lugCount?: number;
    switchCategory?: string | null;
    description?: string | null;
    svgAssetId?: string | null;
    isActive?: boolean;
  };

  const name = body.name?.trim();

  if (
    !name ||
    !body.positionCount ||
    !body.poleCount ||
    !body.lugCount ||
    body.positionCount < 1 ||
    body.poleCount < 1 ||
    body.lugCount < 1
  ) {
    return NextResponse.json(
      { error: "Name, position count, pole count, and lug count are required." },
      { status: 400 }
    );
  }

  const switchType = await prisma.switchType.create({
    data: {
      name,
      slug: body.slug?.trim() || null,
      positionCount: body.positionCount,
      poleCount: body.poleCount,
      lugCount: body.lugCount,
      switchCategory: body.switchCategory?.trim() || null,
      description: body.description?.trim() || null,
      svgAssetId: body.svgAssetId?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(switchType, { status: 201 });
}
