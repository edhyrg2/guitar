import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import {
  buildVerificationEmail,
  generateToken,
  getAppUrl,
  sendEmail,
} from "@/lib/email";

type ResendBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: ResendBody;

  try {
    body = (await request.json()) as ResendBody;
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

  // Always return success — anti-enumeration, same pattern as forgot-password
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, emailVerifiedAt: true, isActive: true },
  });

  if (!user || !user.isActive || user.emailVerifiedAt) {
    return NextResponse.json({ success: true });
  }

  const { token, hashedToken } = generateToken();
  const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt,
    },
  });

  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const emailContent = buildVerificationEmail(user.name, verifyUrl);
  const result = await sendEmail({ to: user.email, ...emailContent });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
