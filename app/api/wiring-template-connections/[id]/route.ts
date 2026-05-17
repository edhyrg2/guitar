import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function parsePathJson(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return Prisma.JsonNull;
  }

  return JSON.parse(trimmed) as Prisma.InputJsonValue;
}

function mapConnectionResponse(record: {
  id: string;
  wiringTemplateId: string;
  fromComponentRole: string;
  fromPointKey: string;
  toComponentRole: string;
  toPointKey: string;
  wireTypeId: string;
  wireColor: string | null;
  pathJson: unknown;
  label: string | null;
  notes: string | null;
  wiringTemplate: { name: string };
  wireType: { name: string };
}) {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    fromComponentRole: record.fromComponentRole,
    fromPointKey: record.fromPointKey,
    toComponentRole: record.toComponentRole,
    toPointKey: record.toPointKey,
    wireTypeId: record.wireTypeId,
    wireTypeName: record.wireType.name,
    wireColor: record.wireColor,
    pathJson:
      record.pathJson === null || record.pathJson === undefined
        ? null
        : JSON.stringify(record.pathJson),
    label: record.label,
    notes: record.notes,
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/wiring-template-connections/[id]">
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
    wiringTemplateId?: string;
    fromComponentRole?: string;
    fromPointKey?: string;
    toComponentRole?: string;
    toPointKey?: string;
    wireTypeId?: string;
    wireColor?: string | null;
    pathJson?: string | null;
    label?: string | null;
    notes?: string | null;
  };

  const wiringTemplateId = body.wiringTemplateId?.trim();
  const fromComponentRole = body.fromComponentRole?.trim();
  const fromPointKey = body.fromPointKey?.trim();
  const toComponentRole = body.toComponentRole?.trim();
  const toPointKey = body.toPointKey?.trim();
  const wireTypeId = body.wireTypeId?.trim();

  if (
    !wiringTemplateId ||
    !fromComponentRole ||
    !fromPointKey ||
    !toComponentRole ||
    !toPointKey ||
    !wireTypeId
  ) {
    return NextResponse.json(
      { error: "Template, component roles, point keys, and wire type are required." },
      { status: 400 }
    );
  }

  try {
    const connection = await prisma.wiringTemplateConnection.update({
      where: { id },
      data: {
        wiringTemplateId,
        fromComponentRole,
        fromPointKey,
        toComponentRole,
        toPointKey,
        wireTypeId,
        wireColor: body.wireColor?.trim() || null,
        pathJson: parsePathJson(body.pathJson),
        label: body.label?.trim() || null,
        notes: body.notes?.trim() || null,
      },
      include: {
        wiringTemplate: {
          select: { name: true },
        },
        wireType: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(mapConnectionResponse(connection));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Path JSON must be valid JSON." },
        { status: 400 }
      );
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/wiring-template-connections/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.wiringTemplateConnection.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
