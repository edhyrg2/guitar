import { NextResponse } from "next/server";
import { CustomComponentDraftStatus, Prisma } from "@prisma/client";

import { getSafeServerSession } from "@/lib/auth-session";
import { saveCustomComponentDraftThumbnail } from "@/lib/custom-component-draft-thumbnail-upload";
import { normalizeEditorDocument } from "@/lib/custom-component-editor-utils";
import { getPrismaClient } from "@/lib/prisma";

type CustomComponentDraftBody = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  thumbnailDataUrl?: string | null;
  document?: unknown;
};

function formatDraftResponse(draft: {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  status: CustomComponentDraftStatus;
  publishedComponentAssetId: string | null;
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

export async function GET() {
  const session = await getSafeServerSession();

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

  const drafts = await prisma.customComponentDraft.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(drafts.map((draft) => formatDraftResponse(draft)));
}

export async function POST(request: Request) {
  const session = await getSafeServerSession();

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

  const body = (await request.json()) as CustomComponentDraftBody;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Draft name is required." }, { status: 400 });
  }

  try {
    const document = normalizeEditorDocument(body.document);
    const thumbnailUrl = body.thumbnailDataUrl?.trim()
      ? await saveCustomComponentDraftThumbnail(body.thumbnailDataUrl, {
          name,
          slug: body.slug?.trim() || null,
        })
      : null;

    const draft = await prisma.customComponentDraft.create({
      data: {
        userId: session.user.id,
        name,
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        thumbnailUrl,
        status: CustomComponentDraftStatus.DRAFT,
        publishedComponentAssetId: null,
        documentJson: document as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(formatDraftResponse(draft), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
