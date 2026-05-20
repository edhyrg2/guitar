import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { saveUserAvatarImage } from "@/lib/user-avatar-upload";

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

  const formData = await request.formData();
  const imageFile = formData.get("imageFile");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json({ error: "Avatar image is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    const photoUrl = await saveUserAvatarImage(imageFile, {
      userName: user.name,
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { photoUrl },
      select: {
        photoUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      photo: updatedUser.photoUrl,
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
