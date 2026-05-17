import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function parseJsonField(value: string) {
  return JSON.parse(value) as Prisma.InputJsonValue;
}

function mapTemplateResponse(record: {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string | null;
  diagramJson: unknown;
  switchLogicJson: unknown;
  isVerified: boolean;
  sourceType: string | null;
  sourceUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  pickupConfiguration: { name: string };
  switchType: { name: string };
}) {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    pickupConfigurationId: record.pickupConfigurationId,
    pickupConfigurationName: record.pickupConfiguration.name,
    switchTypeId: record.switchTypeId,
    switchTypeName: record.switchType.name,
    volumeCount: record.volumeCount,
    toneCount: record.toneCount,
    difficultyLevel: record.difficultyLevel,
    diagramJson: JSON.stringify(record.diagramJson),
    switchLogicJson: JSON.stringify(record.switchLogicJson),
    isVerified: record.isVerified,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/wiring-templates/[id]">
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
    slug?: string | null;
    description?: string | null;
    pickupConfigurationId?: string;
    switchTypeId?: string;
    volumeCount?: number;
    toneCount?: number;
    difficultyLevel?: string | null;
    diagramJson?: string;
    switchLogicJson?: string;
    isVerified?: boolean;
    sourceType?: string | null;
    sourceUrl?: string | null;
    createdBy?: string;
  };

  const name = body.name?.trim();
  const pickupConfigurationId = body.pickupConfigurationId?.trim();
  const switchTypeId = body.switchTypeId?.trim();
  const createdBy = body.createdBy?.trim();

  if (
    !name ||
    !pickupConfigurationId ||
    !switchTypeId ||
    !createdBy ||
    typeof body.volumeCount !== "number" ||
    typeof body.toneCount !== "number" ||
    body.volumeCount < 0 ||
    body.toneCount < 0 ||
    !body.diagramJson?.trim() ||
    !body.switchLogicJson?.trim()
  ) {
    return NextResponse.json(
      { error: "Name, relations, counts, JSON fields, and created by are required." },
      { status: 400 }
    );
  }

  try {
    const template = await prisma.wiringTemplate.update({
      where: { id },
      data: {
        name,
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        pickupConfigurationId,
        switchTypeId,
        volumeCount: body.volumeCount,
        toneCount: body.toneCount,
        difficultyLevel: body.difficultyLevel?.trim() || null,
        diagramJson: parseJsonField(body.diagramJson),
        switchLogicJson: parseJsonField(body.switchLogicJson),
        isVerified: body.isVerified ?? false,
        sourceType: body.sourceType?.trim() || null,
        sourceUrl: body.sourceUrl?.trim() || null,
        createdBy,
      },
      include: {
        pickupConfiguration: {
          select: { name: true },
        },
        switchType: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(mapTemplateResponse(template));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Diagram JSON and switch logic JSON must be valid JSON." },
        { status: 400 }
      );
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/wiring-templates/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.wiringTemplate.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
