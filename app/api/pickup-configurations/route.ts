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

  const configurations = await prisma.pickupConfiguration.findMany({
    orderBy: [{ pickupCount: "desc" }, { code: "asc" }],
  });

  return NextResponse.json(configurations);
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
    code?: string;
    name?: string;
    pickupCount?: number;
    hasNeck?: boolean;
    hasMiddle?: boolean;
    hasBridge?: boolean;
    description?: string | null;
  };

  const code = body.code?.trim().toUpperCase();
  const name = body.name?.trim();

  if (!code || !name || !body.pickupCount || body.pickupCount < 1) {
    return NextResponse.json(
      { error: "Code, name, and pickup count are required." },
      { status: 400 }
    );
  }

  const configuration = await prisma.pickupConfiguration.create({
    data: {
      code,
      name,
      pickupCount: body.pickupCount,
      hasNeck: body.hasNeck ?? false,
      hasMiddle: body.hasMiddle ?? false,
      hasBridge: body.hasBridge ?? false,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(configuration, { status: 201 });
}
