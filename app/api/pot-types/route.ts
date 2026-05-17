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

  const potTypes = await prisma.potType.findMany({
    orderBy: [{ isActive: "desc" }, { valueOhm: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(potTypes);
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

  const potType = await prisma.potType.create({
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

  return NextResponse.json(potType, { status: 201 });
}
