import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function parseMetadataJson(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return Prisma.JsonNull;
  }

  return JSON.parse(trimmed) as Prisma.InputJsonValue;
}

function mapTemplateComponentResponse(record: {
  id: string;
  wiringTemplateId: string;
  componentRole: string;
  componentType: string;
  assetId: string;
  positionX: number;
  positionY: number;
  rotation: number;
  metadataJson: unknown;
  wiringTemplate: { name: string };
  asset: { name: string };
}) {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    componentRole: record.componentRole,
    componentType: record.componentType,
    assetId: record.assetId,
    assetName: record.asset.name,
    positionX: record.positionX,
    positionY: record.positionY,
    rotation: record.rotation,
    metadataJson:
      record.metadataJson === null || record.metadataJson === undefined
        ? null
        : JSON.stringify(record.metadataJson),
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

  const components = await prisma.wiringTemplateComponent.findMany({
    orderBy: [
      { wiringTemplate: { name: "asc" } },
      { componentRole: "asc" },
      { componentType: "asc" },
    ],
    include: {
      wiringTemplate: {
        select: { name: true },
      },
      asset: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(components.map(mapTemplateComponentResponse));
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
    wiringTemplateId?: string;
    componentRole?: string;
    componentType?: string;
    assetId?: string;
    positionX?: number;
    positionY?: number;
    rotation?: number;
    metadataJson?: string | null;
  };

  const wiringTemplateId = body.wiringTemplateId?.trim();
  const componentRole = body.componentRole?.trim();
  const componentType = body.componentType?.trim();
  const assetId = body.assetId?.trim();

  if (
    !wiringTemplateId ||
    !componentRole ||
    !componentType ||
    !assetId ||
    typeof body.positionX !== "number" ||
    typeof body.positionY !== "number" ||
    typeof body.rotation !== "number"
  ) {
    return NextResponse.json(
      { error: "Template, role, type, asset, position, and rotation are required." },
      { status: 400 }
    );
  }

  try {
    const component = await prisma.wiringTemplateComponent.create({
      data: {
        wiringTemplateId,
        componentRole,
        componentType,
        assetId,
        positionX: body.positionX,
        positionY: body.positionY,
        rotation: body.rotation,
        metadataJson: parseMetadataJson(body.metadataJson),
      },
      include: {
        wiringTemplate: {
          select: { name: true },
        },
        asset: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(mapTemplateComponentResponse(component), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Metadata JSON must be valid JSON." },
        { status: 400 }
      );
    }

    throw error;
  }
}
