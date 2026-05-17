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

  const capacitors = await prisma.capacitor.findMany({
    orderBy: [{ isActive: "desc" }, { valueFarads: "asc" }],
  });

  return NextResponse.json(capacitors);
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

  const capacitor = await prisma.capacitor.create({
    data: {
      valueFarads: body.valueFarads,
      valueLabel,
      type: body.type?.trim() || null,
      voltageRating: body.voltageRating?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(capacitor, { status: 201 });
}
