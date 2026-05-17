import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/resistors/[id]">
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
    valueOhm?: number;
    valueLabel?: string;
    wattage?: string | null;
    tolerance?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const valueLabel = body.valueLabel?.trim();

  if (!valueLabel || !body.valueOhm || body.valueOhm <= 0) {
    return NextResponse.json(
      { error: "Value ohm and value label are required." },
      { status: 400 }
    );
  }

  const resistor = await prisma.resistor.update({
    where: { id },
    data: {
      valueOhm: body.valueOhm,
      valueLabel,
      wattage: body.wattage?.trim() || null,
      tolerance: body.tolerance?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(resistor);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/resistors/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.resistor.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
