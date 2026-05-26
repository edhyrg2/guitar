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

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const points = await prisma.componentConnectionPoint.findMany({
    orderBy: [
      { componentAsset: { name: "asc" } },
      { pointType: "asc" },
      { label: "asc" },
    ],
    include: {
      componentAsset: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(points.map(mapConnectionPointResponse));
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
    const createdPoint = await tx.componentConnectionPoint.create({
      data: {
        componentAssetId,
        pointKey,
        label,
        pointType,
        x: body.x as number,
        y: body.y as number,
        description: body.description?.trim() || null,
      },
      include: {
        componentAsset: {
          select: { name: true },
        },
      },
    });

    await syncComponentAssetAnchorPoints(tx, componentAssetId);

    return createdPoint;
  });

  return NextResponse.json(mapConnectionPointResponse(point), { status: 201 });
}
