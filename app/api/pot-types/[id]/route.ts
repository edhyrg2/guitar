import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/pot-types/[id]">
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
    valueOhm?: number;
    valueLabel?: string;
    taper?: string | null;
    potFunction?: string | null;
    isPushPull?: boolean;
    isPushPush?: boolean;
    isNoLoad?: boolean;
    shaftType?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const name = body.name?.trim();
  const valueLabel = body.valueLabel?.trim();

  if (!name || !valueLabel || !body.valueOhm || body.valueOhm < 1) {
    return NextResponse.json(
      { error: "Name, value ohm, and value label are required." },
      { status: 400 }
    );
  }

  const potType = await prisma.potType.update({
    where: { id },
    data: {
      name,
      valueOhm: body.valueOhm,
      valueLabel,
      taper: body.taper?.trim() || null,
      potFunction: body.potFunction?.trim() || null,
      isPushPull: body.isPushPull ?? false,
      isPushPush: body.isPushPush ?? false,
      isNoLoad: body.isNoLoad ?? false,
      shaftType: body.shaftType?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(potType);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/pot-types/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.potType.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
