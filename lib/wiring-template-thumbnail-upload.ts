import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const WIRING_TEMPLATE_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "wiring-templates"
);

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parsePngDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);

  if (!match) {
    throw new Error("Thumbnail must be a PNG data URL.");
  }

  return Buffer.from(match[1], "base64");
}

export async function saveWiringTemplateThumbnail(
  dataUrl: string,
  options: {
    name: string;
    slug?: string | null;
  }
) {
  const buffer = parsePngDataUrl(dataUrl);

  if (buffer.byteLength === 0) {
    throw new Error("Thumbnail image is empty.");
  }

  await mkdir(WIRING_TEMPLATE_UPLOAD_DIR, { recursive: true });

  const fileName = [
    slugifySegment(options.slug ?? "") ||
      slugifySegment(options.name) ||
      "wiring-template",
    randomUUID().slice(0, 8),
    "thumbnail.png",
  ].join("-");
  const filePath = path.join(WIRING_TEMPLATE_UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/wiring-templates/${fileName}`;
}
