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
  thumbnailDataUrl?: string | null;
};

type FormattedSavedSetup = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: BuilderSavedSetupStatus;
  documentJson: Prisma.JsonValue;
  thumbnailUrl: string | null;
  publishedTemplateId: string | null;
  publishedTemplate?: { thumbnailUrl: string | null } | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BuilderSavedSetupDelegate = {
  findMany: (args: {
    where: { userId: string };
    orderBy: Array<Record<string, "asc" | "desc">>;
    include?: { publishedTemplate?: { select: { thumbnailUrl: boolean } } };
  }) => Promise<FormattedSavedSetup[]>;
  create: (args: {
    data: {
      userId: string;
      name: string;
      slug: string | null;
      description: string | null;
      thumbnailUrl?: string | null;
      status: BuilderSavedSetupStatus;
      documentJson: Prisma.InputJsonValue;
      publishedTemplateId: string | null;
      publishedAt: Date | null;
    };
  }) => Promise<FormattedSavedSetup>;
};

function formatSavedSetupResponse(setup: FormattedSavedSetup) {
  return {
    ...setup,
    status: "DRAFT" as const,
    thumbnailUrl: setup.thumbnailUrl ?? setup.publishedTemplate?.thumbnailUrl ?? null,
    publishedAt: setup.publishedAt?.toISOString() ?? null,
    createdAt: setup.createdAt.toISOString(),
    updatedAt: setup.updatedAt.toISOString(),
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

  const builderSavedSetup = (prisma as unknown as {
    builderSavedSetup: BuilderSavedSetupDelegate;
  }).builderSavedSetup;

  const setups = await builderSavedSetup.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    include: { publishedTemplate: { select: { thumbnailUrl: true } } },
  });

  return NextResponse.json(
    setups.map((setup) => formatSavedSetupResponse(setup))
  );
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

  const builderSavedSetup = (prisma as unknown as {
    builderSavedSetup: BuilderSavedSetupDelegate;
  }).builderSavedSetup;

  const body = (await request.json()) as BuilderSavedSetupBody;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Setup name is required." }, { status: 400 });
  }

  try {
    const document = normalizeBuilderSavedSetupDocument(body.document);

    const setup = await builderSavedSetup.create({
      data: {
        userId: session.user.id,
        name,
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        thumbnailUrl: body.thumbnailDataUrl || null,
        status: "DRAFT",
        documentJson: document as Prisma.InputJsonValue,
        publishedTemplateId: null,
        publishedAt: null,
      },
    });

    return NextResponse.json(formatSavedSetupResponse(setup), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
