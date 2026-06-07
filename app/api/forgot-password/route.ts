import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import {
  buildPasswordResetEmail,
  generateToken,
  getAppUrl,
  sendEmail,
} from "@/lib/email";

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: ForgotPasswordBody;

  try {
    body = (await request.json()) as ForgotPasswordBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ success: true });
  }

  const { token, hashedToken } = generateToken();
  const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt,
    },
  });

  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const emailContent = buildPasswordResetEmail(user.name, resetUrl);

  const result = await sendEmail({ to: user.email, ...emailContent });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
