import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { normalizeEditorDocument } from "@/lib/custom-component-editor-utils";
import { getPrismaClient } from "@/lib/prisma";

type CustomComponentDraftBody = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  document?: unknown;
};

function formatDraftResponse(draft: {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  documentJson: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...draft,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/custom-component-drafts/[id]">
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const existingDraft = await prisma.customComponentDraft.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!existingDraft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  const body = (await request.json()) as CustomComponentDraftBody;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Draft name is required." }, { status: 400 });
  }

  try {
    const document = normalizeEditorDocument(body.document);

    const draft = await prisma.customComponentDraft.update({
      where: { id },
      data: {
        name,
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        documentJson: document as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(formatDraftResponse(draft));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/custom-component-drafts/[id]">
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const existingDraft = await prisma.customComponentDraft.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!existingDraft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  await prisma.customComponentDraft.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
