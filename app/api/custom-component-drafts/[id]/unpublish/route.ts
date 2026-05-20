import { NextResponse } from "next/server";
import { CustomComponentDraftStatus } from "@prisma/client";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/custom-component-drafts/[id]/unpublish">
) {
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

  const { id } = await context.params;
  const draft = await prisma.customComponentDraft.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      thumbnailUrl: true,
      publishedComponentAssetId: true,
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (!draft.publishedComponentAssetId) {
    return NextResponse.json(
      { error: "Draft ini belum memiliki komponen yang dipublish." },
      { status: 400 }
    );
  }

  const updatedDraft = await prisma.$transaction(async (tx) => {
    await tx.componentAsset.update({
      where: { id: draft.publishedComponentAssetId! },
      data: { isActive: false },
    });

    return tx.customComponentDraft.update({
      where: { id: draft.id },
      data: {
        status: CustomComponentDraftStatus.UNPUBLISHED,
      },
      select: {
        id: true,
        status: true,
        thumbnailUrl: true,
        publishedComponentAssetId: true,
      },
    });
  });

  return NextResponse.json({
    id: updatedDraft.id,
    status: updatedDraft.status,
    thumbnailUrl: updatedDraft.thumbnailUrl,
    publishedComponentAssetId: updatedDraft.publishedComponentAssetId,
  });
}
