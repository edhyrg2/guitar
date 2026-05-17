import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function mapWireColorSchemaResponse(record: {
  id: string;
  pickupBrandId: string;
  name: string;
  pickupTypeId: string;
  hotColor: string | null;
  groundColor: string | null;
  shieldColor: string | null;
  northStartColor: string | null;
  northFinishColor: string | null;
  southStartColor: string | null;
  southFinishColor: string | null;
  batteryPositiveColor: string | null;
  batteryNegativeColor: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  pickupBrand: { name: string };
  pickupType: { name: string };
}) {
  return {
    id: record.id,
    pickupBrandId: record.pickupBrandId,
    pickupBrandName: record.pickupBrand.name,
    name: record.name,
    pickupTypeId: record.pickupTypeId,
    pickupTypeName: record.pickupType.name,
    hotColor: record.hotColor,
    groundColor: record.groundColor,
    shieldColor: record.shieldColor,
    northStartColor: record.northStartColor,
    northFinishColor: record.northFinishColor,
    southStartColor: record.southStartColor,
    southFinishColor: record.southFinishColor,
    batteryPositiveColor: record.batteryPositiveColor,
    batteryNegativeColor: record.batteryNegativeColor,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const schemas = await prisma.wireColorSchema.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      pickupBrand: { select: { name: true } },
      pickupType: { select: { name: true } },
    },
  });

  return NextResponse.json(schemas.map(mapWireColorSchemaResponse));
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
    pickupBrandId?: string;
    name?: string;
    pickupTypeId?: string;
    hotColor?: string | null;
    groundColor?: string | null;
    shieldColor?: string | null;
    northStartColor?: string | null;
    northFinishColor?: string | null;
    southStartColor?: string | null;
    southFinishColor?: string | null;
    batteryPositiveColor?: string | null;
    batteryNegativeColor?: string | null;
    notes?: string | null;
  };

  const pickupBrandId = body.pickupBrandId?.trim();
  const pickupTypeId = body.pickupTypeId?.trim();
  const name = body.name?.trim();

  if (!pickupBrandId || !pickupTypeId || !name) {
    return NextResponse.json(
      { error: "Pickup brand, pickup type, and name are required." },
      { status: 400 }
    );
  }

  const schema = await prisma.wireColorSchema.create({
    data: {
      pickupBrandId,
      name,
      pickupTypeId,
      hotColor: body.hotColor?.trim() || null,
      groundColor: body.groundColor?.trim() || null,
      shieldColor: body.shieldColor?.trim() || null,
      northStartColor: body.northStartColor?.trim() || null,
      northFinishColor: body.northFinishColor?.trim() || null,
      southStartColor: body.southStartColor?.trim() || null,
      southFinishColor: body.southFinishColor?.trim() || null,
      batteryPositiveColor: body.batteryPositiveColor?.trim() || null,
      batteryNegativeColor: body.batteryNegativeColor?.trim() || null,
      notes: body.notes?.trim() || null,
    },
    include: {
      pickupBrand: { select: { name: true } },
      pickupType: { select: { name: true } },
    },
  });

  return NextResponse.json(mapWireColorSchemaResponse(schema), { status: 201 });
}
