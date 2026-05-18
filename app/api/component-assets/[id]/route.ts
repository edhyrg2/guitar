import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { saveComponentAssetImages } from "@/lib/component-asset-upload";
import { getPrismaClient } from "@/lib/prisma";

function parseAnchorPointsJson(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return Prisma.JsonNull;
  }

  return JSON.parse(trimmed) as Prisma.InputJsonValue;
}

type ComponentAssetBody = {
  ownerType?: string | null;
  ownerId?: string | null;
  componentType?: string;
  name?: string;
  imageUrl?: string | null;
  slug?: string | null;
  svgUrl?: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  anchorPointsJson?: string | null;
  editorDocumentJson?: string | null;
  styleType?: string | null;
  isActive?: boolean;
  imageFile?: File | null;
  svgFile?: File | null;
  thumbnailFile?: File | null;
};

function parseNullableNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const nextValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

async function parseComponentAssetRequest(request: Request): Promise<ComponentAssetBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageFile = formData.get("imageFile");
    const svgFile = formData.get("svgFile");
    const thumbnailFile = formData.get("thumbnailFile");

    return {
      componentType: String(formData.get("componentType") ?? ""),
      ownerType: String(formData.get("ownerType") ?? ""),
      ownerId: String(formData.get("ownerId") ?? ""),
      name: String(formData.get("name") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      svgUrl: String(formData.get("svgUrl") ?? ""),
      thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
      width: parseNullableNumber(String(formData.get("width") ?? "")),
      height: parseNullableNumber(String(formData.get("height") ?? "")),
      anchorPointsJson: String(formData.get("anchorPointsJson") ?? ""),
      editorDocumentJson: String(formData.get("editorDocumentJson") ?? ""),
      styleType: String(formData.get("styleType") ?? ""),
      isActive: String(formData.get("isActive") ?? "true") === "true",
      imageFile: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
      svgFile: svgFile instanceof File && svgFile.size > 0 ? svgFile : null,
      thumbnailFile:
        thumbnailFile instanceof File && thumbnailFile.size > 0 ? thumbnailFile : null,
    };
  }

  return (await request.json()) as ComponentAssetBody;
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/component-assets/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const body = await parseComponentAssetRequest(request);

  const componentType = body.componentType?.trim();
  const name = body.name?.trim();

  if (!componentType || !name) {
    return NextResponse.json(
      { error: "Component type and name are required." },
      { status: 400 }
    );
  }

  try {
    const uploadedImage = body.imageFile ?? body.svgFile ?? body.thumbnailFile ?? null;
    const uploadedPaths = uploadedImage
      ? await saveComponentAssetImages(uploadedImage, {
          componentType,
          name,
        })
      : null;
    const sharedImageUrl =
      body.imageUrl?.trim() || body.svgUrl?.trim() || body.thumbnailUrl?.trim() || null;
    const svgUrl = uploadedPaths?.svgUrl ?? sharedImageUrl;
    const thumbnailUrl = uploadedPaths?.thumbnailUrl ?? sharedImageUrl;

    const componentAsset = await prisma.componentAsset.update({
      where: { id },
      data: {
        componentType,
        ownerType: body.ownerType?.trim() || null,
        ownerId: body.ownerId?.trim() || null,
        name,
        slug: body.slug?.trim() || null,
        svgUrl,
        thumbnailUrl,
        width: body.width ?? null,
        height: body.height ?? null,
        anchorPointsJson: parseAnchorPointsJson(body.anchorPointsJson),
        editorDocumentJson: parseAnchorPointsJson(body.editorDocumentJson),
        styleType: body.styleType?.trim() || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      ...componentAsset,
      anchorPointsJson:
        componentAsset.anchorPointsJson === null ||
        componentAsset.anchorPointsJson === undefined
          ? null
          : JSON.stringify(componentAsset.anchorPointsJson),
      editorDocumentJson:
        componentAsset.editorDocumentJson === null ||
        componentAsset.editorDocumentJson === undefined
          ? null
          : JSON.stringify(componentAsset.editorDocumentJson),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Anchor points JSON must be valid JSON." },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/component-assets/[id]">
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  await prisma.componentAsset.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
