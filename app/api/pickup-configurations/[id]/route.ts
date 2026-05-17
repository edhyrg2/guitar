import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/pickup-configurations/[id]">
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
    code?: string;
    name?: string;
    pickupCount?: number;
    hasNeck?: boolean;
    hasMiddle?: boolean;
    hasBridge?: boolean;
    description?: string | null;
  };

  const code = body.code?.trim().toUpperCase();
  const name = body.name?.trim();

  if (!code || !name || !body.pickupCount || body.pickupCount < 1) {
    return NextResponse.json(
      { error: "Code, name, and pickup count are required." },
      { status: 400 }
    );
  }

  const configuration = await prisma.pickupConfiguration.update({
    where: { id },
    data: {
      code,
      name,
      pickupCount: body.pickupCount,
      hasNeck: body.hasNeck ?? false,
      hasMiddle: body.hasMiddle ?? false,
      hasBridge: body.hasBridge ?? false,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(configuration);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/pickup-configurations/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.pickupConfiguration.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
