import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

// DELETE /api/wiring-templates/[id]/comments/[commentId]
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/wiring-templates/[id]/comments/[commentId]">
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

  const { commentId } = await context.params;

  const comment = await prisma.wiringTemplateComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.wiringTemplateComment.delete({ where: { id: commentId } });

  return NextResponse.json({ deleted: true });
}
