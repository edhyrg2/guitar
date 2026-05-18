import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

function parseVerifiedAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_VERIFIED_AT");
  }

  return date;
}

function mapDiagramSourceResponse(record: {
  id: string;
  wiringTemplateId: string;
  sourceName: string;
  sourceBrand: string | null;
  sourceUrl: string | null;
  sourceFileUrl: string | null;
  sourceType: string | null;
  licenseNotes: string | null;
  isOfficial: boolean;
  verifiedAt: Date | null;
  notes: string | null;
  wiringTemplate: { name: string };
}) {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    sourceName: record.sourceName,
    sourceBrand: record.sourceBrand,
    sourceUrl: record.sourceUrl,
    sourceFileUrl: record.sourceFileUrl,
    sourceType: record.sourceType,
    licenseNotes: record.licenseNotes,
    isOfficial: record.isOfficial,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    notes: record.notes,
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/diagram-sources/[id]">
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
    sourceName?: string;
    sourceBrand?: string | null;
    sourceUrl?: string | null;
    sourceFileUrl?: string | null;
    sourceType?: string | null;
    licenseNotes?: string | null;
    isOfficial?: boolean;
    verifiedAt?: string | null;
    notes?: string | null;
  };

  const wiringTemplateId = body.wiringTemplateId?.trim();
  const sourceName = body.sourceName?.trim();

  if (!wiringTemplateId || !sourceName) {
    return NextResponse.json(
      { error: "Wiring template and source name are required." },
      { status: 400 }
    );
  }

  try {
    const diagramSource = await prisma.diagramSource.update({
      where: { id },
      data: {
        wiringTemplateId,
        sourceName,
        sourceBrand: body.sourceBrand?.trim() || null,
        sourceUrl: body.sourceUrl?.trim() || null,
        sourceFileUrl: body.sourceFileUrl?.trim() || null,
        sourceType: body.sourceType?.trim() || null,
        licenseNotes: body.licenseNotes?.trim() || null,
        isOfficial: body.isOfficial ?? false,
        verifiedAt: parseVerifiedAt(body.verifiedAt),
        notes: body.notes?.trim() || null,
      },
      include: {
        wiringTemplate: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(mapDiagramSourceResponse(diagramSource));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_VERIFIED_AT") {
      return NextResponse.json(
        { error: "Verified at must be a valid datetime." },
        { status: 400 }
      );
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/diagram-sources/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.diagramSource.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
