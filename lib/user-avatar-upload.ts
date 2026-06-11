import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { uploadToR2 } from "@/lib/r2-storage";

const ALLOWED_AVATAR_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const AVATAR_SIZE = 512;

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isAllowedUserAvatarFile(file: File) {
  const name = file.name.toLowerCase();
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex) : "";

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
  const key = `user-avatars/${fileName}`;

  return uploadToR2(key, outputBuffer, "image/webp");
}
