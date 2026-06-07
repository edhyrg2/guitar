import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { USER_AVATAR_UPLOAD_DIR } from "@/lib/user-avatar-upload";

const ALLOWED_FILENAME = /^[a-z0-9][a-z0-9\-]*\.webp$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;

  if (!ALLOWED_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filePath = path.join(USER_AVATAR_UPLOAD_DIR, filename);

  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(USER_AVATAR_UPLOAD_DIR);

  if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
