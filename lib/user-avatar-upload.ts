import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const ALLOWED_AVATAR_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const USER_AVATAR_UPLOAD_DIR = path.join(
  process.cwd(),
  "storage",
  "uploads",
  "user-avatars"
);

export { USER_AVATAR_UPLOAD_DIR };
const AVATAR_SIZE = 512;

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isAllowedUserAvatarFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  return (
    ALLOWED_AVATAR_EXTENSIONS.has(extension) ||
    ALLOWED_AVATAR_MIME_TYPES.has(file.type)
  );
}

export async function saveUserAvatarImage(
  file: File,
  options: { userName: string }
) {
  if (!isAllowedUserAvatarFile(file)) {
    throw new Error("Only PNG, JPG, JPEG, and WEBP avatar files are allowed.");
  }

  await mkdir(USER_AVATAR_UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(buffer)
    .resize({
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 84 })
    .toBuffer();

  const fileName = [
    slugifySegment(options.userName) || "user",
    randomUUID().slice(0, 8),
    "avatar.webp",
  ].join("-");
  const outputPath = path.join(USER_AVATAR_UPLOAD_DIR, fileName);

  await writeFile(outputPath, outputBuffer);

  return `/api/uploads/user-avatars/${fileName}`;
}
