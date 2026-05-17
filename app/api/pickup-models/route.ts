import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function mapPickupModelResponse(record: {
  id: string;
  pickupBrandId: string;
  pickupTypeId: string;
  name: string;
  slug: string | null;
  positionType: string | null;
  wireCount: string | null;
  magnetType: string | null;
  dcResistance: string | null;
  outputLevel: string | null;
  isActivePickup: boolean;
  colorCodeSchemaId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  pickupBrand: { name: string };
  pickupType: { name: string };
}) {
  return {
    id: record.id,
    pickupBrandId: record.pickupBrandId,
    pickupTypeId: record.pickupTypeId,
    pickupBrandName: record.pickupBrand.name,
    pickupTypeName: record.pickupType.name,
    name: record.name,
    slug: record.slug,
    positionType: record.positionType,
    wireCount: record.wireCount,
    magnetType: record.magnetType,
    dcResistance: record.dcResistance,
    outputLevel: record.outputLevel,
    isActivePickup: record.isActivePickup,
    colorCodeSchemaId: record.colorCodeSchemaId,
    description: record.description,
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

  const pickupModels = await prisma.pickupModel.findMany({
    orderBy: [{ isActivePickup: "desc" }, { name: "asc" }],
    include: {
      pickupBrand: {
        select: { name: true },
      },
      pickupType: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(pickupModels.map(mapPickupModelResponse));
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
    pickupTypeId?: string;
    name?: string;
    slug?: string | null;
    positionType?: string | null;
    wireCount?: string | null;
    magnetType?: string | null;
    dcResistance?: string | null;
    outputLevel?: string | null;
    isActivePickup?: boolean;
    colorCodeSchemaId?: string | null;
    description?: string | null;
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

  const pickupModel = await prisma.pickupModel.create({
    data: {
      pickupBrandId,
      pickupTypeId,
      name,
      slug: body.slug?.trim() || null,
      positionType: body.positionType?.trim() || null,
      wireCount: body.wireCount?.trim() || null,
      magnetType: body.magnetType?.trim() || null,
      dcResistance: body.dcResistance?.trim() || null,
      outputLevel: body.outputLevel?.trim() || null,
      isActivePickup: body.isActivePickup ?? true,
      colorCodeSchemaId: body.colorCodeSchemaId?.trim() || null,
      description: body.description?.trim() || null,
    },
    include: {
      pickupBrand: {
        select: { name: true },
      },
      pickupType: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(mapPickupModelResponse(pickupModel), { status: 201 });
}
