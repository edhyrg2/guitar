import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/wiring-templates/[id]/love">
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

  const template = await prisma.wiringTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      loveCount: true,
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingLove = await tx.wiringTemplateLove.findUnique({
      where: {
        userId_wiringTemplateId: {
          userId: session.user.id,
          wiringTemplateId: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingLove) {
      const currentTemplate = await tx.wiringTemplate.findUnique({
        where: { id },
        select: {
          loveCount: true,
        },
      });

      if (!currentTemplate) {
        throw new Error("Template not found.");
      }

      const updatedTemplate = await tx.wiringTemplate.update({
        where: { id },
        data: {
          loveCount: Math.max(currentTemplate.loveCount - 1, 0),
        },
        select: {
          loveCount: true,
        },
      });

      await tx.wiringTemplateLove.delete({
        where: {
          userId_wiringTemplateId: {
            userId: session.user.id,
            wiringTemplateId: id,
          },
        },
      });

      return {
        loved: false,
        loveCount: Math.max(updatedTemplate.loveCount, 0),
      };
    }

    await tx.wiringTemplateLove.create({
      data: {
        userId: session.user.id,
        wiringTemplateId: id,
      },
    });

    const updatedTemplate = await tx.wiringTemplate.update({
      where: { id },
      data: {
        loveCount: {
          increment: 1,
        },
      },
      select: {
        loveCount: true,
      },
    });

    return {
      loved: true,
      loveCount: updatedTemplate.loveCount,
    };
  });

  return NextResponse.json(result);
}
