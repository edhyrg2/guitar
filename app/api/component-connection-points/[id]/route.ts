import { NextResponse } from "next/server";

import { syncComponentAssetAnchorPoints } from "@/lib/component-connection-point-sync";
import { getPrismaClient } from "@/lib/prisma";

function mapConnectionPointResponse(record: {
  id: string;
  componentAssetId: string;
  pointKey: string;
  label: string;
  pointType: string;
  x: number;
  y: number;
  description: string | null;
  componentAsset: { name: string };
}) {
  return {
    id: record.id,
    componentAssetId: record.componentAssetId,
    componentAssetName: record.componentAsset.name,
    pointKey: record.pointKey,
    label: record.label,
    pointType: record.pointType,
    x: record.x,
    y: record.y,
    description: record.description,
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/component-connection-points/[id]">
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
    componentAssetId?: string;
    pointKey?: string;
    label?: string;
    pointType?: string;
    x?: number;
    y?: number;
    description?: string | null;
  };

  const componentAssetId = body.componentAssetId?.trim();
  const pointKey = body.pointKey?.trim();
  const label = body.label?.trim();
  const pointType = body.pointType?.trim();

  if (
    !componentAssetId ||
    !pointKey ||
    !label ||
    !pointType ||
    typeof body.x !== "number" ||
    typeof body.y !== "number"
  ) {
    return NextResponse.json(
      { error: "Component asset, point key, label, point type, x, and y are required." },
      { status: 400 }
    );
  }

  const point = await prisma.$transaction(async (tx) => {
    const existingPoint = await tx.componentConnectionPoint.findUnique({
      where: { id },
      select: { componentAssetId: true },
    });

    if (!existingPoint) {
      throw new Error("Connection point not found.");
    }

    const updatedPoint = await tx.componentConnectionPoint.update({
      where: { id },
      data: {
        componentAssetId,
        pointKey,
        label,
        pointType,
        x: body.x,
        y: body.y,
        description: body.description?.trim() || null,
      },
      include: {
        componentAsset: {
          select: { name: true },
        },
      },
    });

    await syncComponentAssetAnchorPoints(tx, componentAssetId);

    if (existingPoint.componentAssetId !== componentAssetId) {
      await syncComponentAssetAnchorPoints(tx, existingPoint.componentAssetId);
    }

    return updatedPoint;
  });

  return NextResponse.json(mapConnectionPointResponse(point));
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/component-connection-points/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.$transaction(async (tx) => {
    const existingPoint = await tx.componentConnectionPoint.findUnique({
      where: { id },
      select: { componentAssetId: true },
    });

    if (!existingPoint) {
      throw new Error("Connection point not found.");
    }

    await tx.componentConnectionPoint.delete({
      where: { id },
    });

    await syncComponentAssetAnchorPoints(tx, existingPoint.componentAssetId);
  });

  return NextResponse.json({ success: true });
}
