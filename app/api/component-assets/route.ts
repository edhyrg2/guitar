import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { saveComponentAssetFile } from "@/lib/component-asset-upload";
import { getPrismaClient } from "@/lib/prisma";

function parseAnchorPointsJson(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return Prisma.JsonNull;
  }

  return JSON.parse(trimmed) as Prisma.InputJsonValue;
}

type ComponentAssetBody = {
  componentType?: string;
  name?: string;
  slug?: string | null;
  svgUrl?: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  anchorPointsJson?: string | null;
  styleType?: string | null;
  isActive?: boolean;
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
    const svgFile = formData.get("svgFile");
    const thumbnailFile = formData.get("thumbnailFile");

    return {
      componentType: String(formData.get("componentType") ?? ""),
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      svgUrl: String(formData.get("svgUrl") ?? ""),
      thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
      width: parseNullableNumber(String(formData.get("width") ?? "")),
      height: parseNullableNumber(String(formData.get("height") ?? "")),
      anchorPointsJson: String(formData.get("anchorPointsJson") ?? ""),
      styleType: String(formData.get("styleType") ?? ""),
      isActive: String(formData.get("isActive") ?? "true") === "true",
      svgFile: svgFile instanceof File && svgFile.size > 0 ? svgFile : null,
      thumbnailFile:
        thumbnailFile instanceof File && thumbnailFile.size > 0 ? thumbnailFile : null,
    };
  }

  return (await request.json()) as ComponentAssetBody;
}

export async function GET() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const componentAssets = await prisma.componentAsset.findMany({
    orderBy: [{ isActive: "desc" }, { componentType: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    componentAssets.map((item) => ({
      ...item,
      anchorPointsJson:
        item.anchorPointsJson === null || item.anchorPointsJson === undefined
          ? null
          : JSON.stringify(item.anchorPointsJson),
    }))
  );
}

export async function POST(request: Request) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

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
    const svgUrl = body.svgFile
      ? await saveComponentAssetFile(body.svgFile, {
          componentType,
          name,
          fieldName: "svg",
        })
      : body.svgUrl?.trim() || null;
    const thumbnailUrl = body.thumbnailFile
      ? await saveComponentAssetFile(body.thumbnailFile, {
          componentType,
          name,
          fieldName: "thumbnail",
        })
      : body.thumbnailUrl?.trim() || null;

    const componentAsset = await prisma.componentAsset.create({
      data: {
        componentType,
        name,
        slug: body.slug?.trim() || null,
        svgUrl,
        thumbnailUrl,
        width: body.width ?? null,
        height: body.height ?? null,
        anchorPointsJson: parseAnchorPointsJson(body.anchorPointsJson),
        styleType: body.styleType?.trim() || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        ...componentAsset,
        anchorPointsJson:
          componentAsset.anchorPointsJson === null ||
          componentAsset.anchorPointsJson === undefined
            ? null
            : JSON.stringify(componentAsset.anchorPointsJson),
      },
      { status: 201 }
    );
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
