import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const mods = await prisma.mod.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(mods);
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

  const mod = await prisma.mod.create({
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

  return NextResponse.json(mod, { status: 201 });
}
