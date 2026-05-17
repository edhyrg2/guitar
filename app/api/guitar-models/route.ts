import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function mapGuitarModelResponse(record: {
  id: string;
  guitarBrandId: string;
  name: string;
  slug: string | null;
  series: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  bodyType: string | null;
  defaultPickupConfig: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  guitarBrand: { name: string };
}) {
  return {
    id: record.id,
    guitarBrandId: record.guitarBrandId,
    guitarBrandName: record.guitarBrand.name,
    name: record.name,
    slug: record.slug,
    series: record.series,
    yearStart: record.yearStart,
    yearEnd: record.yearEnd,
    bodyType: record.bodyType,
    defaultPickupConfig: record.defaultPickupConfig,
    description: record.description,
    isActive: record.isActive,
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

  const guitarModels = await prisma.guitarModel.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      guitarBrand: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(guitarModels.map(mapGuitarModelResponse));
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
    guitarBrandId?: string;
    name?: string;
    slug?: string | null;
    series?: string | null;
    yearStart?: number | null;
    yearEnd?: number | null;
    bodyType?: string | null;
    defaultPickupConfig?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const guitarBrandId = body.guitarBrandId?.trim();
  const name = body.name?.trim();

  if (!guitarBrandId || !name) {
    return NextResponse.json(
      { error: "Guitar brand and name are required." },
      { status: 400 }
    );
  }

  const guitarModel = await prisma.guitarModel.create({
    data: {
      guitarBrandId,
      name,
      slug: body.slug?.trim() || null,
      series: body.series?.trim() || null,
      yearStart: body.yearStart ?? null,
      yearEnd: body.yearEnd ?? null,
      bodyType: body.bodyType?.trim() || null,
      defaultPickupConfig: body.defaultPickupConfig?.trim() || null,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
    },
    include: {
      guitarBrand: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(mapGuitarModelResponse(guitarModel), { status: 201 });
}
