import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/capacitors/[id]">
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
    valueFarads?: number;
    valueLabel?: string;
    type?: string | null;
    voltageRating?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const valueLabel = body.valueLabel?.trim();

  if (!valueLabel || !body.valueFarads || body.valueFarads <= 0) {
    return NextResponse.json(
      { error: "Value farads and value label are required." },
      { status: 400 }
    );
  }

  const capacitor = await prisma.capacitor.update({
    where: { id },
    data: {
      valueFarads: body.valueFarads,
      valueLabel,
      type: body.type?.trim() || null,
      voltageRating: body.voltageRating?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(capacitor);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/capacitors/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.capacitor.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
