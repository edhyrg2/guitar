import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { uploadToR2 } from "@/lib/r2-storage";

const ALLOWED_IMAGE_EXTENSIONS = new Set([".svg", ".png", ".jpg", ".jpeg"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
]);

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
  const name = file.name.toLowerCase();
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex) : "";

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

function getContentType(extension: string) {
  switch (extension) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

export function isAllowedComponentAssetFile(file: File) {
  const name = file.name.toLowerCase();
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex) : "";

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileNamePrefix = buildFileNamePrefix(options.componentType, options.name);
  const assetKey = `component-assets/${fileNamePrefix}-asset${extension}`;
  const thumbnailKey = `component-assets/${fileNamePrefix}-thumbnail.webp`;
  const thumbnailBuffer = await createThumbnailBuffer(file);

  const [svgUrl, thumbnailUrl] = await Promise.all([
    uploadToR2(assetKey, buffer, getContentType(extension)),
    uploadToR2(thumbnailKey, thumbnailBuffer, "image/webp"),
  ]);

  return {
    svgUrl,
    thumbnailUrl,
  };
}
