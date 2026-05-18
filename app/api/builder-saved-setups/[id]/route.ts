import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSafeServerSession } from "@/lib/auth-session";
import {
  normalizeBuilderSavedSetupDocument,
  type BuilderSavedSetupStatus,
} from "@/lib/custom-builder-saved-setup-types";
import { getPrismaClient } from "@/lib/prisma";

type BuilderSavedSetupBody = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  status?: BuilderSavedSetupStatus;
  document?: unknown;
};

type FormattedSavedSetup = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: BuilderSavedSetupStatus;
  documentJson: Prisma.JsonValue;
  publishedTemplateId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BuilderSavedSetupDelegate = {
  findFirst: (args: {
    where: { id: string; userId: string };
    select: { id: true; publishedAt?: true; publishedTemplateId?: true };
  }) => Promise<
    { id: string; publishedAt?: Date | null; publishedTemplateId?: string | null } | null
  >;
  update: (args: {
    where: { id: string };
    data: {
      name: string;
      slug: string | null;
      description: string | null;
      status: BuilderSavedSetupStatus;
      documentJson: Prisma.InputJsonValue;
      publishedTemplateId: string | null;
      publishedAt: Date | null;
    };
  }) => Promise<FormattedSavedSetup>;
  delete: (args: { where: { id: string } }) => Promise<void>;
};

function formatSavedSetupResponse(setup: FormattedSavedSetup) {
  return {
    ...setup,
    status: "DRAFT" as const,
    publishedAt: setup.publishedAt?.toISOString() ?? null,
    createdAt: setup.createdAt.toISOString(),
    updatedAt: setup.updatedAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/builder-saved-setups/[id]">
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

  const builderSavedSetup = (prisma as unknown as {
    builderSavedSetup: BuilderSavedSetupDelegate;
  }).builderSavedSetup;

  const { id } = await context.params;
  const existingSetup = await builderSavedSetup.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: { id: true, publishedAt: true, publishedTemplateId: true },
  });

  if (!existingSetup) {
    return NextResponse.json({ error: "Saved setup not found." }, { status: 404 });
  }

  const body = (await request.json()) as BuilderSavedSetupBody;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Setup name is required." }, { status: 400 });
  }

  try {
    const document = normalizeBuilderSavedSetupDocument(body.document);

    const setup = await builderSavedSetup.update({
      where: { id },
      data: {
        name,
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        status: "DRAFT",
        documentJson: document as Prisma.InputJsonValue,
        publishedTemplateId: existingSetup.publishedTemplateId ?? null,
        publishedAt: existingSetup.publishedAt ?? null,
      },
    });

    return NextResponse.json(formatSavedSetupResponse(setup));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/builder-saved-setups/[id]">
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

  const builderSavedSetup = (prisma as unknown as {
    builderSavedSetup: BuilderSavedSetupDelegate;
  }).builderSavedSetup;

  const { id } = await context.params;
  const existingSetup = await builderSavedSetup.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!existingSetup) {
    return NextResponse.json({ error: "Saved setup not found." }, { status: 404 });
  }

  await builderSavedSetup.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
