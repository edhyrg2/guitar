import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/wire-types/[id]">
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

  const wireType = await prisma.wireType.update({
    where: { id },
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

  return NextResponse.json(wireType);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/wire-types/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.wireType.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
