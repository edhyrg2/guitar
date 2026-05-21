import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

// GET /api/wiring-templates/[id]/comments
export async function GET(
  _request: Request,
  context: RouteContext<"/api/wiring-templates/[id]/comments">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  const comments = await prisma.wiringTemplateComment.findMany({
    where: { wiringTemplateId: id, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, photoUrl: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, photoUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ comments });
}

// POST /api/wiring-templates/[id]/comments
export async function POST(
  request: Request,
  context: RouteContext<"/api/wiring-templates/[id]/comments">
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

  const body = (await request.json()) as { body?: string; parentId?: string };
  const text = body.body?.trim();

  if (!text) {
    return NextResponse.json({ error: "Comment body is required." }, { status: 400 });
  }

  if (text.length > 2000) {
    return NextResponse.json({ error: "Comment is too long." }, { status: 400 });
  }

  const template = await prisma.wiringTemplate.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // Validate parent if replying
  if (body.parentId) {
    const parent = await prisma.wiringTemplateComment.findUnique({
      where: { id: body.parentId },
      select: { id: true, wiringTemplateId: true, parentId: true },
    });

    if (!parent || parent.wiringTemplateId !== id || parent.parentId !== null) {
      return NextResponse.json({ error: "Invalid parent comment." }, { status: 400 });
    }
  }

  const comment = await prisma.wiringTemplateComment.create({
    data: {
      userId: session.user.id,
      wiringTemplateId: id,
      parentId: body.parentId ?? null,
      body: text,
    },
    include: {
      user: { select: { id: true, name: true, photoUrl: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, photoUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
