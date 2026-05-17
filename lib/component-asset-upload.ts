import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_IMAGE_EXTENSIONS = new Set([".svg", ".png", ".jpg", ".jpeg"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
]);

const COMPONENT_ASSET_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "component-assets"
);

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getFileExtension(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  if (ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return extension;
  }

  if (file.type === "image/svg+xml") {
    return ".svg";
  }

  if (file.type === "image/png") {
    return ".png";
  }

  if (file.type === "image/jpeg") {
    return ".jpg";
  }

  return "";
}

export function isAllowedComponentAssetFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  return (
    ALLOWED_IMAGE_EXTENSIONS.has(extension) ||
    ALLOWED_IMAGE_MIME_TYPES.has(file.type)
  );
}

export async function saveComponentAssetFile(
  file: File,
  options: {
    componentType: string;
    name: string;
    fieldName: "svg" | "thumbnail";
  }
) {
  if (!isAllowedComponentAssetFile(file)) {
    throw new Error("Only JPG, JPEG, PNG, and SVG files are allowed.");
  }

  const extension = getFileExtension(file);

  if (!extension) {
    throw new Error("Unable to determine the uploaded file extension.");
  }

  await mkdir(COMPONENT_ASSET_UPLOAD_DIR, { recursive: true });

  const fileName = [
    slugifySegment(options.componentType) || "component",
    slugifySegment(options.name) || "asset",
    options.fieldName,
    randomUUID().slice(0, 8),
  ].join("-");

  const targetPath = path.join(COMPONENT_ASSET_UPLOAD_DIR, `${fileName}${extension}`);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(targetPath, buffer);

  return `/uploads/component-assets/${fileName}${extension}`;
}
