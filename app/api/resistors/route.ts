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

  const resistors = await prisma.resistor.findMany({
    orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }],
  });

  return NextResponse.json(resistors);
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

  const resistor = await prisma.resistor.create({
    data: {
      valueOhm: body.valueOhm,
      valueLabel,
      wattage: body.wattage?.trim() || null,
      tolerance: body.tolerance?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(resistor, { status: 201 });
}
