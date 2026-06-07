import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import { hashToken } from "@/lib/email";

type VerifyEmailBody = {
  token?: string;
};

export async function POST(request: Request) {
  let body: VerifyEmailBody;

  try {
    body = (await request.json()) as VerifyEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt: { gt: new Date() },
    },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired verification link. Please request a new one." },
      { status: 400 }
    );
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
