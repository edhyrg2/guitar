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

  const wireTypes = await prisma.wireType.findMany({
    orderBy: [{ wireFunction: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(wireTypes);
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
    color?: string | null;
    hexColor?: string | null;
    wireFunction?: string | null;
    isShielded?: boolean;
    isGround?: boolean;
    description?: string | null;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  const wireType = await prisma.wireType.create({
    data: {
      name,
      color: body.color?.trim() || null,
      hexColor: body.hexColor?.trim() || null,
      wireFunction: body.wireFunction?.trim() || null,
      isShielded: body.isShielded ?? false,
      isGround: body.isGround ?? false,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(wireType, { status: 201 });
}
