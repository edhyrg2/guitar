import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { getPrismaClient } from "@/lib/prisma";
import {
  buildVerificationEmail,
  generateToken,
  getAppUrl,
  sendEmail,
} from "@/lib/email";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);
  const { token, hashedToken } = generateToken();
  const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      level: "USER",
      isActive: true,
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt,
    },
  });

  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const emailContent = buildVerificationEmail(name, verifyUrl);
  const result = await sendEmail({ to: email, ...emailContent });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
