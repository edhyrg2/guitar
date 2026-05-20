import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/wiring-templates/[id]/save">
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
      saveCount: true,
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingSave = await tx.wiringTemplateSave.findUnique({
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

    if (existingSave) {
      const currentTemplate = await tx.wiringTemplate.findUnique({
        where: { id },
        select: {
          saveCount: true,
        },
      });

      if (!currentTemplate) {
        throw new Error("Template not found.");
      }

      const updatedTemplate = await tx.wiringTemplate.update({
        where: { id },
        data: {
          saveCount: Math.max(currentTemplate.saveCount - 1, 0),
        },
        select: {
          saveCount: true,
        },
      });

      await tx.wiringTemplateSave.delete({
        where: {
          userId_wiringTemplateId: {
            userId: session.user.id,
            wiringTemplateId: id,
          },
        },
      });

      return {
        saved: false,
        saveCount: Math.max(updatedTemplate.saveCount, 0),
      };
    }

    await tx.wiringTemplateSave.create({
      data: {
        userId: session.user.id,
        wiringTemplateId: id,
      },
    });

    const updatedTemplate = await tx.wiringTemplate.update({
      where: { id },
      data: {
        saveCount: {
          increment: 1,
        },
      },
      select: {
        saveCount: true,
      },
    });

    return {
      saved: true,
      saveCount: updatedTemplate.saveCount,
    };
  });

  return NextResponse.json(result);
}
