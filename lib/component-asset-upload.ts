import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

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
const THUMBNAIL_MAX_SIZE = 320;
const THUMBNAIL_QUALITY = 72;

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

type SaveComponentAssetImagesResult = {
  svgUrl: string;
  thumbnailUrl: string;
};

function buildFileNamePrefix(componentType: string, name: string) {
  return [
    slugifySegment(componentType) || "component",
    slugifySegment(name) || "asset",
    randomUUID().slice(0, 8),
  ].join("-");
}

async function createThumbnailBuffer(file: File) {
  const input = Buffer.from(await file.arrayBuffer());

  return sharp(input, file.type === "image/svg+xml" ? { density: 300 } : undefined)
    .resize({
      width: THUMBNAIL_MAX_SIZE,
      height: THUMBNAIL_MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();
}

export async function saveComponentAssetImages(
  file: File,
  options: {
    componentType: string;
    name: string;
  }
): Promise<SaveComponentAssetImagesResult> {
  if (!isAllowedComponentAssetFile(file)) {
    throw new Error("Only JPG, JPEG, PNG, and SVG files are allowed.");
  }

  const extension = getFileExtension(file);

  if (!extension) {
    throw new Error("Unable to determine the uploaded file extension.");
  }

  await mkdir(COMPONENT_ASSET_UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileNamePrefix = buildFileNamePrefix(options.componentType, options.name);
  const assetFileName = `${fileNamePrefix}-asset${extension}`;
  const thumbnailFileName = `${fileNamePrefix}-thumbnail.webp`;
  const assetPath = path.join(COMPONENT_ASSET_UPLOAD_DIR, assetFileName);
  const thumbnailPath = path.join(COMPONENT_ASSET_UPLOAD_DIR, thumbnailFileName);
  const thumbnailBuffer = await createThumbnailBuffer(file);

  await Promise.all([writeFile(assetPath, buffer), writeFile(thumbnailPath, thumbnailBuffer)]);

  return {
    svgUrl: `/uploads/component-assets/${assetFileName}`,
    thumbnailUrl: `/uploads/component-assets/${thumbnailFileName}`,
  };
}
