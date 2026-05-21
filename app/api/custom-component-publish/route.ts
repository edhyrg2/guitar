import { NextResponse } from "next/server";
import { CustomComponentDraftStatus, Prisma } from "@prisma/client";

import { getSafeServerSession } from "@/lib/auth-session";
import { saveComponentAssetImages } from "@/lib/component-asset-upload";
import type { PublishType } from "@/lib/custom-component-publish-target-types";
import { getPrismaClient } from "@/lib/prisma";

type PublishConnectionPoint = {
  key?: string;
  label?: string;
  pointType?: string;
  color?: string;
  x?: number;
  y?: number;
  description?: string | null;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueComponentAssetSlug(
  tx: Prisma.TransactionClient,
  baseSlug: string,
  currentAssetId: string | null
) {
  const normalizedBase = slugify(baseSlug) || "custom-component";
  let candidate = normalizedBase;
  let suffix = 2;

  while (true) {
    const existing = await tx.componentAsset.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentAssetId) {
      return candidate;
    }

    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
}

async function ensureUniqueOwnerSlug(params: {
  tx: Prisma.TransactionClient;
  model: "switchType" | "pickupModel" | "pickupType" | "outputJack" | "mod";
  baseSlug: string | null;
  currentOwnerId: string | null;
}) {
  const { tx, model, baseSlug, currentOwnerId } = params;

  if (!baseSlug?.trim()) {
    return null;
  }

  const normalizedBase = slugify(baseSlug);

  if (!normalizedBase) {
    return null;
  }

  let candidate = normalizedBase;
  let suffix = 2;

  while (true) {
    const existing =
      model === "switchType"
        ? await tx.switchType.findUnique({
            where: { slug: candidate },
            select: { id: true },
          })
        : model === "pickupModel"
          ? await tx.pickupModel.findUnique({
              where: { slug: candidate },
              select: { id: true },
            })
        : model === "pickupType"
          ? await tx.pickupType.findUnique({
              where: { slug: candidate },
              select: { id: true },
            })
          : model === "outputJack"
            ? await tx.outputJack.findUnique({
                where: { slug: candidate },
                select: { id: true },
              })
          : await tx.mod.findUnique({
              where: { slug: candidate },
              select: { id: true },
            });

    if (!existing || existing.id === currentOwnerId) {
      return candidate;
    }

    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
}

function parseNullableNumber(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return JSON.parse(value) as T;
}

function normalizeConnectionPoints(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("connectionPointsJson must be an array.");
  }

  const normalized = value.map((point, index) => {
    const item = point as PublishConnectionPoint;
    const key = item.key?.trim();
    const label = item.label?.trim();
    const pointType = item.pointType?.trim();

    if (!key || !label || !pointType) {
      throw new Error(`connectionPointsJson[${index}] requires key, label, and pointType.`);
    }

    if (typeof item.x !== "number" || typeof item.y !== "number") {
      throw new Error(`connectionPointsJson[${index}] requires numeric x and y.`);
    }

    return {
      pointKey: key,
      label,
      pointType,
      color: item.color?.trim() || null,
      x: item.x,
      y: item.y,
      description: item.description?.trim() || null,
    };
  });

  const seenKeys = new Set<string>();

  for (const point of normalized) {
    const originalKey = point.pointKey.trim().toLowerCase();
    let nextKey = originalKey || "point";
    let suffix = 2;

    while (seenKeys.has(nextKey)) {
      nextKey = `${originalKey || "point"}-${suffix}`;
      suffix += 1;
    }

    point.pointKey = nextKey;
    seenKeys.add(nextKey);
  }

  return normalized;
}

function localizeConnectionPoints(
  connectionPoints: ReturnType<typeof normalizeConnectionPoints>,
  origin: { x: number; y: number }
) {
  return connectionPoints.map((point) => ({
    ...point,
    x: point.x - origin.x,
    y: point.y - origin.y,
  }));
}

function buildAssetName(publishType: PublishType, payload: Record<string, unknown>) {
  if (publishType === "resistor") {
    return [payload.valueLabel, payload.wattage].filter(Boolean).join(" ");
  }

  if (publishType === "capacitor") {
    return [payload.valueLabel, payload.type].filter(Boolean).join(" ");
  }

  return String(payload.name ?? "").trim();
}

function getOwnerType(publishType: PublishType) {
  return publishType;
}

function getComponentTypeLabel(publishType: PublishType) {
  switch (publishType) {
    case "switch-type":
      return "Switch Type";
    case "pot-type":
      return "Potentiometer";
    case "capacitor":
      return "Capacitor";
    case "resistor":
      return "Resistor";
    case "pickup-model":
      return "Pickup";
    case "pickup-type":
      return "Pickup Type";
    case "output-jack":
      return "Output Jack";
    case "mod":
      return "Accessory / Mod";
  }
}

async function upsertOwner(
  tx: Prisma.TransactionClient,
  publishType: PublishType,
  payload: Record<string, unknown>,
  editingOwnerId: string | null
) {
  if (publishType === "switch-type") {
    const name = String(payload.name ?? "").trim();
    const positionCount = Number(payload.positionCount ?? 0);
    const poleCount = Number(payload.poleCount ?? 0);
    const lugCount = Number(payload.lugCount ?? 0);

    if (!name || positionCount < 1 || poleCount < 1 || lugCount < 1) {
      throw new Error("Switch type requires name, position count, pole count, and lug count.");
    }

    const ownerSlug = await ensureUniqueOwnerSlug({
      tx,
      model: "switchType",
      baseSlug: String(payload.slug ?? "").trim() || null,
      currentOwnerId: editingOwnerId,
    });

    const data = {
      name,
      slug: ownerSlug,
      positionCount,
      poleCount,
      lugCount,
      switchCategory: String(payload.switchCategory ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    return editingOwnerId
      ? await tx.switchType.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, name: true, slug: true },
        })
      : await tx.switchType.create({
          data,
          select: { id: true, name: true, slug: true },
        });
  }

  if (publishType === "pot-type") {
    const name = String(payload.name ?? "").trim();
    const valueOhm = Number(payload.valueOhm ?? 0);
    const valueLabel = String(payload.valueLabel ?? "").trim();

    if (!name || !valueLabel || valueOhm < 1) {
      throw new Error("Potentiometer requires name, value ohm, and value label.");
    }

    const data = {
      name,
      valueOhm,
      valueLabel,
      taper: String(payload.taper ?? "").trim() || null,
      potFunction: String(payload.potFunction ?? "").trim() || null,
      isPushPull: Boolean(payload.isPushPull),
      isPushPush: Boolean(payload.isPushPush),
      isNoLoad: Boolean(payload.isNoLoad),
      shaftType: String(payload.shaftType ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    const owner = editingOwnerId
      ? await tx.potType.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, name: true },
        })
      : await tx.potType.create({
          data,
          select: { id: true, name: true },
        });

    return { ...owner, slug: null };
  }

  if (publishType === "capacitor") {
    const valueFarads = Number(payload.valueFarads ?? 0);
    const valueLabel = String(payload.valueLabel ?? "").trim();

    if (!valueLabel || valueFarads <= 0) {
      throw new Error("Capacitor requires value farads and value label.");
    }

    const data = {
      valueFarads,
      valueLabel,
      type: String(payload.type ?? "").trim() || null,
      voltageRating: String(payload.voltageRating ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    const owner = editingOwnerId
      ? await tx.capacitor.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, valueLabel: true },
        })
      : await tx.capacitor.create({
          data,
          select: { id: true, valueLabel: true },
        });

    return { id: owner.id, name: owner.valueLabel, slug: null };
  }

  if (publishType === "resistor") {
    const valueOhm = Number(payload.valueOhm ?? 0);
    const valueLabel = String(payload.valueLabel ?? "").trim();

    if (!valueLabel || valueOhm <= 0) {
      throw new Error("Resistor requires value ohm and value label.");
    }

    const data = {
      valueOhm,
      valueLabel,
      wattage: String(payload.wattage ?? "").trim() || null,
      tolerance: String(payload.tolerance ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    const owner = editingOwnerId
      ? await tx.resistor.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, valueLabel: true },
        })
      : await tx.resistor.create({
          data,
          select: { id: true, valueLabel: true },
        });

    return { id: owner.id, name: owner.valueLabel, slug: null };
  }

  if (publishType === "pickup-model") {
    const name = String(payload.name ?? "").trim();
    const pickupBrandId = String(payload.pickupBrandId ?? "").trim();
    const pickupTypeId = String(payload.pickupTypeId ?? "").trim();

    if (!name || !pickupBrandId || !pickupTypeId) {
      throw new Error("Pickup model requires brand, type, and name.");
    }

    const ownerSlug = await ensureUniqueOwnerSlug({
      tx,
      model: "pickupModel",
      baseSlug: String(payload.slug ?? "").trim() || null,
      currentOwnerId: editingOwnerId,
    });

    const data = {
      pickupBrandId,
      pickupTypeId,
      name,
      slug: ownerSlug,
      positionType: String(payload.positionType ?? "").trim() || null,
      wireCount: String(payload.wireCount ?? "").trim() || null,
      magnetType: String(payload.magnetType ?? "").trim() || null,
      dcResistance: String(payload.dcResistance ?? "").trim() || null,
      outputLevel: String(payload.outputLevel ?? "").trim() || null,
      colorCodeSchemaId: String(payload.colorCodeSchemaId ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActivePickup: payload.isActivePickup === false ? false : true,
    };

    return editingOwnerId
      ? await tx.pickupModel.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, name: true, slug: true },
        })
      : await tx.pickupModel.create({
          data,
          select: { id: true, name: true, slug: true },
        });
  }

  if (publishType === "pickup-type") {
    const name = String(payload.name ?? "").trim();

    if (!name) {
      throw new Error("Pickup type requires name.");
    }

    const ownerSlug = await ensureUniqueOwnerSlug({
      tx,
      model: "pickupType",
      baseSlug: String(payload.slug ?? "").trim() || null,
      currentOwnerId: editingOwnerId,
    });

    const data = {
      name,
      slug: ownerSlug,
      coilCount: String(payload.coilCount ?? "").trim() || null,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    return editingOwnerId
      ? await tx.pickupType.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, name: true, slug: true },
        })
      : await tx.pickupType.create({
          data,
          select: { id: true, name: true, slug: true },
        });
  }

  if (publishType === "output-jack") {
    const name = String(payload.name ?? "").trim();

    if (!name) {
      throw new Error("Output jack requires name.");
    }

    const ownerSlug = await ensureUniqueOwnerSlug({
      tx,
      model: "outputJack",
      baseSlug: String(payload.slug ?? "").trim() || null,
      currentOwnerId: editingOwnerId,
    });

    const conductorCount = parseNullableNumber(String(payload.conductorCount ?? "")) ?? 0;

    if (conductorCount < 1) {
      throw new Error("Output jack requires conductor count.");
    }

    const data = {
      name,
      slug: ownerSlug,
      jackType: String(payload.jackType ?? "").trim() || null,
      mountingStyle: String(payload.mountingStyle ?? "").trim() || null,
      conductorCount,
      description: String(payload.description ?? "").trim() || null,
      isActive: payload.isActive === false ? false : true,
    };

    return editingOwnerId
      ? await tx.outputJack.update({
          where: { id: editingOwnerId },
          data,
          select: { id: true, name: true, slug: true },
        })
      : await tx.outputJack.create({
          data,
          select: { id: true, name: true, slug: true },
        });
  }

  const name = String(payload.name ?? "").trim();

  if (!name) {
    throw new Error("Accessory / mod requires name.");
  }

  const ownerSlug = await ensureUniqueOwnerSlug({
    tx,
    model: "mod",
    baseSlug: String(payload.slug ?? "").trim() || null,
    currentOwnerId: editingOwnerId,
  });

  const data = {
    name,
    slug: ownerSlug,
    description: String(payload.description ?? "").trim() || null,
    difficultyLevel: String(payload.difficultyLevel ?? "").trim() || null,
    requiresPushPull: Boolean(payload.requiresPushPull),
    requiresMiniToggle: Boolean(payload.requiresMiniToggle),
    requiresSpecialSwitch: Boolean(payload.requiresSpecialSwitch),
    isActive: payload.isActive === false ? false : true,
  };

  return editingOwnerId
    ? await tx.mod.update({
        where: { id: editingOwnerId },
        data,
        select: { id: true, name: true, slug: true },
      })
    : await tx.mod.create({
        data,
        select: { id: true, name: true, slug: true },
      });
}

async function syncOwnerVisualData(
  tx: Prisma.TransactionClient,
  publishType: PublishType,
  ownerId: string,
  data: {
    svgUrl: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
    anchorPointsJson: Prisma.InputJsonValue;
    editorDocumentJson: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    styleType: string | null;
  }
) {
  if (publishType === "switch-type") {
    await tx.switchType.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  if (publishType === "pot-type") {
    await tx.potType.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  if (publishType === "capacitor") {
    await tx.capacitor.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  if (publishType === "resistor") {
    await tx.resistor.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  if (publishType === "pickup-model") {
    return;
  }

  if (publishType === "pickup-type") {
    await tx.pickupType.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  if (publishType === "output-jack") {
    await tx.outputJack.update({
      where: { id: ownerId },
      data: {
        svgUrl: data.svgUrl,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        anchorPointsJson: data.anchorPointsJson,
        editorDocumentJson: data.editorDocumentJson,
        styleType: data.styleType,
      },
    });
    return;
  }

  await tx.mod.update({
    where: { id: ownerId },
    data: {
      svgUrl: data.svgUrl,
      thumbnailUrl: data.thumbnailUrl,
      width: data.width,
      height: data.height,
      anchorPointsJson: data.anchorPointsJson,
      editorDocumentJson: data.editorDocumentJson,
      styleType: data.styleType,
    },
  });
}

export async function POST(request: Request) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const publishType = String(formData.get("publishType") ?? "").trim() as PublishType;
  const payload = parseJson<Record<string, unknown>>(formData.get("payloadJson"), {});
  const editorDocument = parseJson<Record<string, unknown> | null>(
    formData.get("editorDocumentJson"),
    null
  );
  const connectionPoints = normalizeConnectionPoints(
    parseJson<unknown[]>(formData.get("connectionPointsJson"), [])
  );
  const imageFile = formData.get("imageFile");
  const styleType = String(formData.get("styleType") ?? "").trim() || null;
  const ownerType = String(formData.get("ownerType") ?? "").trim() || null;
  const ownerId = String(formData.get("ownerId") ?? "").trim() || null;
  const draftId = String(formData.get("draftId") ?? "").trim() || null;
  const requestedSlug = String(formData.get("assetSlug") ?? "").trim() || null;
  const width = parseNullableNumber(String(formData.get("width") ?? ""));
  const height = parseNullableNumber(String(formData.get("height") ?? ""));
  const originX = parseNullableNumber(String(formData.get("originX") ?? "")) ?? 0;
  const originY = parseNullableNumber(String(formData.get("originY") ?? "")) ?? 0;

  if (
    publishType !== "switch-type" &&
    publishType !== "pot-type" &&
    publishType !== "capacitor" &&
    publishType !== "resistor" &&
    publishType !== "pickup-model" &&
    publishType !== "pickup-type" &&
    publishType !== "output-jack" &&
    publishType !== "mod"
  ) {
    return NextResponse.json({ error: "Unsupported publish type." }, { status: 400 });
  }

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json({ error: "Rendered component image is required." }, { status: 400 });
  }

  const assetName = buildAssetName(publishType, payload);

  if (!assetName) {
    return NextResponse.json({ error: "Component name is required." }, { status: 400 });
  }

  const expectedOwnerType = getOwnerType(publishType);

  if (ownerType && ownerType !== expectedOwnerType) {
    return NextResponse.json(
      { error: "Owner type does not match publish type." },
      { status: 400 }
    );
  }

  const localizedConnectionPoints = localizeConnectionPoints(connectionPoints, {
    x: originX,
    y: originY,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const owner = await upsertOwner(tx, publishType, payload, ownerId);

      const uploadedPaths = await saveComponentAssetImages(imageFile, {
        componentType: getComponentTypeLabel(publishType),
        name: assetName,
      });

      const existingAsset = await tx.componentAsset.findUnique({
        where: {
          ownerType_ownerId: {
            ownerType: expectedOwnerType,
            ownerId: owner.id,
          },
        },
        select: { id: true },
      });
      const assetSlug = await ensureUniqueComponentAssetSlug(
        tx,
        requestedSlug || assetName,
        existingAsset?.id ?? null
      );

      const componentAsset = existingAsset
        ? await tx.componentAsset.update({
            where: { id: existingAsset.id },
            data: {
              componentType: getComponentTypeLabel(publishType),
              name: assetName,
              slug: assetSlug,
              svgUrl: uploadedPaths.svgUrl,
              thumbnailUrl: uploadedPaths.thumbnailUrl,
              width,
              height,
              anchorPointsJson: localizedConnectionPoints as Prisma.InputJsonValue,
              editorDocumentJson:
                editorDocument === null
                  ? Prisma.JsonNull
                  : (editorDocument as Prisma.InputJsonValue),
              styleType,
              isActive: payload.isActive === false ? false : true,
            },
            select: {
              id: true,
              ownerType: true,
              ownerId: true,
              componentType: true,
              name: true,
              slug: true,
              svgUrl: true,
              thumbnailUrl: true,
              width: true,
              height: true,
              anchorPointsJson: true,
              editorDocumentJson: true,
              styleType: true,
              isActive: true,
            },
          })
        : await tx.componentAsset.create({
            data: {
              ownerType: expectedOwnerType,
              ownerId: owner.id,
              componentType: getComponentTypeLabel(publishType),
              name: assetName,
              slug: assetSlug,
              svgUrl: uploadedPaths.svgUrl,
              thumbnailUrl: uploadedPaths.thumbnailUrl,
              width,
              height,
              anchorPointsJson: localizedConnectionPoints as Prisma.InputJsonValue,
              editorDocumentJson:
                editorDocument === null
                  ? Prisma.JsonNull
                  : (editorDocument as Prisma.InputJsonValue),
              styleType,
              isActive: payload.isActive === false ? false : true,
            },
            select: {
              id: true,
              ownerType: true,
              ownerId: true,
              componentType: true,
              name: true,
              slug: true,
              svgUrl: true,
              thumbnailUrl: true,
              width: true,
              height: true,
              anchorPointsJson: true,
              editorDocumentJson: true,
              styleType: true,
              isActive: true,
            },
          });

      const ownerVisualData = {
        svgUrl: uploadedPaths.svgUrl,
        thumbnailUrl: uploadedPaths.thumbnailUrl,
        width,
        height,
        anchorPointsJson: localizedConnectionPoints as Prisma.InputJsonValue,
        editorDocumentJson:
          editorDocument === null
            ? Prisma.JsonNull
            : (editorDocument as Prisma.InputJsonValue),
        styleType,
      };

      await syncOwnerVisualData(tx, publishType, owner.id, ownerVisualData);

      await tx.componentConnectionPoint.deleteMany({
        where: { componentAssetId: componentAsset.id },
      });

      if (localizedConnectionPoints.length > 0) {
        await tx.componentConnectionPoint.createMany({
          data: localizedConnectionPoints.map((point) => ({
            componentAssetId: componentAsset.id,
            pointKey: point.pointKey,
            label: point.label,
            pointType: point.pointType,
            x: point.x,
            y: point.y,
            description: point.description,
          })),
        });
      }

      if (publishType === "switch-type") {
        await tx.switchType.update({
          where: { id: owner.id },
          data: { svgAssetId: componentAsset.id },
        });
      }

      if (draftId) {
        await tx.customComponentDraft.updateMany({
          where: {
            id: draftId,
            userId: session.user.id,
          },
          data: {
            publishedComponentAssetId: componentAsset.id,
            status: CustomComponentDraftStatus.PUBLISHED,
          },
        });
      }

      return {
        owner,
        asset: {
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
        },
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : typeof error.meta?.target === "string"
          ? error.meta.target
          : "unknown field";
      const message =
        target === "unknown field"
          ? "A record with the same unique value already exists. Check asset slug, owner slug, or duplicate connection point keys."
          : `A record with the same unique value already exists (${target}).`;

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unexpected server error while publishing custom component." },
      { status: 500 }
    );
  }
}
