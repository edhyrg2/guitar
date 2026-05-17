import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/mods/[id]">
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
    name?: string;
    slug?: string | null;
    description?: string | null;
    requiresPushPull?: boolean;
    requiresMiniToggle?: boolean;
    requiresSpecialSwitch?: boolean;
    difficultyLevel?: string | null;
    isActive?: boolean;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  const mod = await prisma.mod.update({
    where: { id },
    data: {
      name,
      slug: body.slug?.trim() || null,
      description: body.description?.trim() || null,
      requiresPushPull: body.requiresPushPull ?? false,
      requiresMiniToggle: body.requiresMiniToggle ?? false,
      requiresSpecialSwitch: body.requiresSpecialSwitch ?? false,
      difficultyLevel: body.difficultyLevel?.trim() || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(mod);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/mods/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.mod.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
