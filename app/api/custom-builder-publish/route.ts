import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import {
  normalizeBuilderSavedSetupDocument,
  type BuilderSavedSetupDocument,
} from "@/lib/custom-builder-saved-setup-types";
import { getPrismaClient } from "@/lib/prisma";
import { saveWiringTemplateThumbnail } from "@/lib/wiring-template-thumbnail-upload";

type PublishBody = {
  savedSetupId?: string | null;
  thumbnailDataUrl?: string | null;
  name?: string;
  slug?: string | null;
  description?: string | null;
  pickupConfigurationId?: string;
  switchTypeId?: string;
  volumeCount?: number;
  toneCount?: number;
  difficultyLevel?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  isVerified?: boolean;
  document?: unknown;
};

type FormattedSavedSetup = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  documentJson: Prisma.JsonValue;
  publishedTemplateId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BuilderSavedSetupDelegate = {
  findFirst: (args: {
    where: { id: string; userId: string };
    select: {
      id: true;
      name: true;
      slug: true;
      description: true;
      publishedAt: true;
      publishedTemplateId: true;
    };
  }) => Promise<{
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    publishedAt: Date | null;
    publishedTemplateId: string | null;
  } | null>;
  update: (args: {
    where: { id: string };
    data: {
      name: string;
      slug: string | null;
      description: string | null;
      status: "DRAFT";
      documentJson: Prisma.InputJsonValue;
      publishedTemplateId: string;
      publishedAt: Date;
    };
  }) => Promise<FormattedSavedSetup>;
};

type WiringTemplateDelegate = {
  create: (args: {
    data: {
      name: string;
      slug: string | null;
      description: string | null;
      thumbnailUrl: string | null;
      pickupConfigurationId: string;
      switchTypeId: string;
      volumeCount: number;
      toneCount: number;
      difficultyLevel: string | null;
      diagramJson: Prisma.InputJsonValue;
      switchLogicJson: Prisma.InputJsonValue;
      isVerified: boolean;
      sourceType: string;
      sourceUrl: string | null;
      createdBy: string;
    };
    select: {
      id: true;
      name: true;
      slug: true;
    };
  }) => Promise<{ id: string; name: string; slug: string | null }>;
  update: (args: {
    where: { id: string };
    data: {
      name: string;
      slug: string | null;
      description: string | null;
      thumbnailUrl: string | null;
      pickupConfigurationId: string;
      switchTypeId: string;
      volumeCount: number;
      toneCount: number;
      difficultyLevel: string | null;
      diagramJson: Prisma.InputJsonValue;
      switchLogicJson: Prisma.InputJsonValue;
      isVerified: boolean;
      sourceType: string;
      sourceUrl: string | null;
      createdBy: string;
    };
    select: {
      id: true;
      name: true;
      slug: true;
    };
  }) => Promise<{ id: string; name: string; slug: string | null }>;
};

type WiringTemplateComponentDelegate = {
  createMany: (args: {
    data: Array<{
      wiringTemplateId: string;
      componentRole: string;
      componentType: string;
      assetId: string;
      positionX: number;
      positionY: number;
      rotation: number;
      scale: number;
      showLabel: boolean;
      metadataJson: Prisma.InputJsonValue;
    }>;
  }) => Promise<unknown>;
  deleteMany: (args: {
    where: {
      wiringTemplateId: string;
    };
  }) => Promise<unknown>;
};

type WiringTemplateConnectionDelegate = {
  createMany: (args: {
    data: Array<{
      wiringTemplateId: string;
      fromComponentRole: string;
      fromPointKey: string;
      toComponentRole: string;
      toPointKey: string;
      wireTypeId: string;
      wireColor: string | null;
      pathJson: Prisma.InputJsonValue;
      label: string | null;
      notes: string | null;
    }>;
  }) => Promise<unknown>;
  deleteMany: (args: {
    where: {
      wiringTemplateId: string;
    };
  }) => Promise<unknown>;
};

type PublishTransactionClient = {
  wiringTemplate: WiringTemplateDelegate;
  wiringTemplateComponent: WiringTemplateComponentDelegate;
  wiringTemplateConnection: WiringTemplateConnectionDelegate;
  builderSavedSetup: BuilderSavedSetupDelegate;
};

function createComponentRole(name: string, index: number) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "component"}-${index + 1}`;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getComponentCategory(componentType: string | null | undefined) {
  const normalized = normalizeText(componentType);

  if (normalized === "pickup" || normalized === "pickup type") {
    return "pickup";
  }

  if (
    normalized === "potentiometer" ||
    normalized === "pot" ||
    normalized === "pot type"
  ) {
    return "potentiometer";
  }

  if (normalized === "switch" || normalized === "switch type") {
    return "switch";
  }

  if (normalized === "capacitor") {
    return "capacitor";
  }

  if (normalized === "resistor") {
    return "resistor";
  }

  if (
    normalized === "output jack" ||
    normalized === "output" ||
    normalized === "jack"
  ) {
    return "output";
  }

  if (
    normalized === "accessory / mod" ||
    normalized === "accessory" ||
    normalized === "mod"
  ) {
    return "mod";
  }

  return normalized;
}

function getPickupPositionLabel(count: number, index: number) {
  if (count === 1) {
    return "Bridge";
  }

  if (count === 2) {
    return index === 0 ? "Neck" : "Bridge";
  }

  if (count === 3) {
    return index === 0 ? "Neck" : index === 1 ? "Middle" : "Bridge";
  }

  return `Pickup ${index + 1}`;
}

function inferPickupKind(name: string) {
  const normalized = normalizeText(name);

  if (normalized.includes("humbucker")) {
    return "H";
  }

  if (normalized.includes("single")) {
    return "S";
  }

  if (normalized.includes("p90") || normalized.includes("p-90")) {
    return "P90";
  }

  return "S";
}

function inferPotRole(name: string) {
  const normalized = normalizeText(name);

  if (normalized.includes("volume")) {
    return "volume";
  }

  if (normalized.includes("tone")) {
    return "tone";
  }

  if (normalized.includes("blend")) {
    return "blend";
  }

  return "other";
}

function createCanvasInventory(document: BuilderSavedSetupDocument) {
  const pickups = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "pickup")
    .sort((left, right) => left.x - right.x)
    .map((instance, index, collection) => ({
      role: getPickupPositionLabel(collection.length, index),
      name: instance.name,
    }));
  const potentiometers = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "potentiometer")
    .map((instance) => ({
      role: inferPotRole(instance.name),
      name: instance.name,
    }));
  const switches = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "switch")
    .map((instance) => instance.name);
  const capacitors = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "capacitor")
    .map((instance) => instance.name);
  const resistors = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "resistor")
    .map((instance) => instance.name);
  const outputs = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "output")
    .map((instance) => instance.name);
  const mods = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "mod")
    .map((instance) => instance.name);

  return {
    pickups,
    potentiometers,
    switches,
    capacitors,
    resistors,
    outputs,
    mods,
  };
}

function deriveDetectedCounts(inventory: ReturnType<typeof createCanvasInventory>) {
  return {
    volumeCount: inventory.potentiometers.filter((item) => item.role === "volume").length,
    toneCount: inventory.potentiometers.filter((item) => item.role === "tone").length,
  };
}

function deriveSwitchTypeId(document: BuilderSavedSetupDocument) {
  const switchInstance = document.instances.find(
    (instance) => getComponentCategory(instance.componentType) === "switch"
  );
  const parsedReference = switchInstance ? parseOwnerReference(switchInstance.assetId) : null;

  if (!parsedReference || parsedReference.ownerType !== "switch-type") {
    return null;
  }

  return parsedReference.ownerId;
}

function derivePickupConfigurationId(
  document: BuilderSavedSetupDocument,
  pickupConfigurations: Array<{
    id: string;
    code: string;
    pickupCount: number;
    hasNeck: boolean;
    hasMiddle: boolean;
    hasBridge: boolean;
  }>
) {
  const pickups = document.instances
    .filter((instance) => getComponentCategory(instance.componentType) === "pickup")
    .sort((left, right) => left.x - right.x);

  if (pickups.length === 0) {
    return null;
  }

  const pickupKinds = pickups.map((instance) => inferPickupKind(instance.name));
  const pickupPattern = pickupKinds.join("");
  const candidates = pickupConfigurations.filter((configuration) => {
    if (configuration.pickupCount !== pickups.length) {
      return false;
    }

    if (pickups.length === 1) {
      return configuration.hasBridge || configuration.hasNeck || configuration.hasMiddle;
    }

    if (pickups.length === 2) {
      return configuration.hasNeck && configuration.hasBridge && !configuration.hasMiddle;
    }

    if (pickups.length === 3) {
      return configuration.hasNeck && configuration.hasMiddle && configuration.hasBridge;
    }

    return true;
  });
  const exactCodeMatch = candidates.find(
    (configuration) => normalizeText(configuration.code) === pickupPattern.toLowerCase()
  );

  if (exactCodeMatch) {
    return exactCodeMatch.id;
  }

  return candidates[0]?.id ?? null;
}

function createDiagramJson(document: BuilderSavedSetupDocument, roleMap: Map<string, string>) {
  const inventory = createCanvasInventory(document);

  return {
    builder: {
      version: document.version,
      selectedWireTypeId: document.selectedWireTypeId,
      shapes: document.shapes,
      inventory,
    },
    components: document.instances.map((instance) => ({
      id: instance.id,
      role: roleMap.get(instance.id) ?? instance.id,
      assetId: instance.assetId,
      name: instance.name,
      componentType: instance.componentType,
      x: instance.x,
      y: instance.y,
      rotation: instance.rotation,
      scale: instance.scale,
      showLabel: instance.showLabel,
    })),
    wires: document.connections.map((connection) => ({
      id: connection.id,
      fromComponentRole: roleMap.get(connection.fromInstanceId) ?? connection.fromInstanceId,
      fromPointKey: connection.fromPointKey,
      toComponentRole: roleMap.get(connection.toInstanceId) ?? connection.toInstanceId,
      toPointKey: connection.toPointKey,
      wireTypeId: connection.wireTypeId,
      controlPoints: connection.controlPoints,
    })),
  } satisfies Prisma.InputJsonValue;
}

function createSwitchLogicJson(document: BuilderSavedSetupDocument, roleMap: Map<string, string>) {
  const inventory = createCanvasInventory(document);

  return {
    builderConnections: document.connections.map((connection) => ({
      fromComponentRole: roleMap.get(connection.fromInstanceId) ?? connection.fromInstanceId,
      fromPointKey: connection.fromPointKey,
      toComponentRole: roleMap.get(connection.toInstanceId) ?? connection.toInstanceId,
      toPointKey: connection.toPointKey,
      wireTypeId: connection.wireTypeId,
    })),
    inventory,
    notes: "Generated from custom builder publish flow.",
  } satisfies Prisma.InputJsonValue;
}

function createConnectionPathJson(connection: BuilderSavedSetupDocument["connections"][number]) {
  return {
    kind: "builder-wire-path",
    controlPoints: connection.controlPoints,
  } satisfies Prisma.InputJsonValue;
}

function parseOwnerReference(assetId: string) {
  const separatorIndex = assetId.indexOf(":");

  if (separatorIndex <= 0 || separatorIndex >= assetId.length - 1) {
    return null;
  }

  return {
    ownerType: assetId.slice(0, separatorIndex),
    ownerId: assetId.slice(separatorIndex + 1),
  };
}

function formatSavedSetupResponse(setup: FormattedSavedSetup) {
  return {
    ...setup,
    status: "DRAFT" as const,
    publishedAt: setup.publishedAt?.toISOString() ?? null,
    createdAt: setup.createdAt.toISOString(),
    updatedAt: setup.updatedAt.toISOString(),
  };
}

function formatPublishDatabaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const meta =
      error.meta && typeof error.meta === "object"
        ? JSON.stringify(error.meta)
        : null;

    if (error.code === "P2002") {
      return {
        status: 409,
        message: meta
          ? `Template slug already exists. Database detail: ${meta}`
          : "Template slug already exists. Change the slug and retry.",
      };
    }

    return {
      status: 400,
      message: `Database error (${error.code})${meta ? `: ${meta}` : "."}`,
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      message: `Database validation error: ${error.message}`,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: `Publish failed: ${error.message}`,
    };
  }

  return {
    status: 500,
    message: "Publish failed because of an unknown database error.",
  };
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

  let body: PublishBody;

  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const requestedPickupConfigurationId = body.pickupConfigurationId?.trim() || null;
  const requestedSwitchTypeId = body.switchTypeId?.trim() || null;
  const savedSetupId = body.savedSetupId?.trim() || null;
  const thumbnailDataUrl = body.thumbnailDataUrl?.trim() || null;
  const requestedVolumeCount = body.volumeCount;
  const requestedToneCount = body.toneCount;

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  const document = normalizeBuilderSavedSetupDocument(body.document);

  if (document.instances.length === 0) {
    return NextResponse.json(
      { error: "Builder must contain at least one component before publishing." },
      { status: 400 }
    );
  }

  const ownerReferences = document.instances
    .map((instance) => parseOwnerReference(instance.assetId))
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const inventory = createCanvasInventory(document);
  const detectedCounts = deriveDetectedCounts(inventory);
  const derivedSwitchTypeId = deriveSwitchTypeId(document);
  const [pickupConfigurations, switchTypes, assets, wireTypes] = await Promise.all([
    prisma.pickupConfiguration.findMany({
      orderBy: [{ pickupCount: "desc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        pickupCount: true,
        hasNeck: true,
        hasMiddle: true,
        hasBridge: true,
        name: true,
      },
    }),
    prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.componentAsset.findMany({
      where: {
        OR: [
          {
            id: {
              in: document.instances
                .map((instance) => instance.componentAssetId)
                .filter((value): value is string => Boolean(value)),
            },
          },
          ...ownerReferences.map((reference) => ({
            ownerType: reference.ownerType,
            ownerId: reference.ownerId,
          })),
        ],
      },
      select: {
        id: true,
        name: true,
        ownerType: true,
        ownerId: true,
      },
    }),
    prisma.wireType.findMany({
      where: {
        id: {
          in: document.connections.map((connection) => connection.wireTypeId),
        },
      },
      select: {
        id: true,
        hexColor: true,
      },
    }),
  ]);

  const derivedPickupConfigurationId = derivePickupConfigurationId(
    document,
    pickupConfigurations
  );
  const pickupConfigurationId =
    requestedPickupConfigurationId ??
    derivedPickupConfigurationId ??
    pickupConfigurations[0]?.id ??
    null;
  const switchTypeId =
    requestedSwitchTypeId ??
    derivedSwitchTypeId ??
    switchTypes[0]?.id ??
    null;
  const volumeCount =
    typeof requestedVolumeCount === "number" && requestedVolumeCount >= 0
      ? requestedVolumeCount
      : detectedCounts.volumeCount;
  const toneCount =
    typeof requestedToneCount === "number" && requestedToneCount >= 0
      ? requestedToneCount
      : detectedCounts.toneCount;
  const pickupConfiguration =
    pickupConfigurationId
      ? pickupConfigurations.find((item) => item.id === pickupConfigurationId) ?? null
      : null;
  const switchType =
    switchTypeId ? switchTypes.find((item) => item.id === switchTypeId) ?? null : null;

  if (!pickupConfiguration) {
    return NextResponse.json(
      { error: "Unable to resolve pickup configuration from the builder canvas." },
      { status: 400 }
    );
  }

  if (!switchType) {
    return NextResponse.json(
      { error: "Unable to resolve switch type from the builder canvas." },
      { status: 400 }
    );
  }

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const assetByOwnerMap = new Map(
    assets
      .filter((asset) => asset.ownerType && asset.ownerId)
      .map((asset) => [`${asset.ownerType}:${asset.ownerId}`, asset])
  );
  const wireTypeMap = new Map(wireTypes.map((wireType) => [wireType.id, wireType]));

  for (const instance of document.instances) {
    const componentAsset =
      (instance.componentAssetId ? assetMap.get(instance.componentAssetId) : null) ??
      assetByOwnerMap.get(instance.assetId);

    if (!componentAsset) {
      return NextResponse.json(
        { error: `Component asset for "${instance.name}" does not exist.` },
        { status: 400 }
      );
    }
  }

  for (const connection of document.connections) {
    if (!wireTypeMap.has(connection.wireTypeId)) {
      return NextResponse.json(
        { error: `Wire type "${connection.wireTypeId}" does not exist.` },
        { status: 400 }
      );
    }
  }

  const roleMap = new Map(
    document.instances.map((instance, index) => [instance.id, createComponentRole(instance.name, index)])
  );

  const connectionPointAssetIds = Array.from(
    new Set(
      document.instances
        .map((instance) => {
          const componentAsset =
            (instance.componentAssetId ? assetMap.get(instance.componentAssetId) : null) ??
            assetByOwnerMap.get(instance.assetId);

          return componentAsset?.id ?? null;
        })
        .filter((value): value is string => Boolean(value))
    )
  );
  const connectionPoints = await prisma.componentConnectionPoint.findMany({
    where: {
      componentAssetId: {
        in: connectionPointAssetIds,
      },
    },
    select: {
      componentAssetId: true,
      pointKey: true,
    },
  });
  const pointRegistry = new Set(
    connectionPoints.map(
      (point) => `${point.componentAssetId}:${point.pointKey.trim().toLowerCase()}`
    )
  );
  const instanceById = new Map(document.instances.map((instance) => [instance.id, instance]));

  for (const connection of document.connections) {
    const fromInstance = instanceById.get(connection.fromInstanceId);
    const toInstance = instanceById.get(connection.toInstanceId);

    if (!fromInstance || !toInstance) {
      return NextResponse.json(
        { error: "Connection references a missing component instance." },
        { status: 400 }
      );
    }

    const fromComponentAsset =
      (fromInstance.componentAssetId ? assetMap.get(fromInstance.componentAssetId) : null) ??
      assetByOwnerMap.get(fromInstance.assetId);
    const toComponentAsset =
      (toInstance.componentAssetId ? assetMap.get(toInstance.componentAssetId) : null) ??
      assetByOwnerMap.get(toInstance.assetId);

    if (!fromComponentAsset || !toComponentAsset) {
      return NextResponse.json(
        { error: "Connection references a component without a published visual asset." },
        { status: 400 }
      );
    }

    const fromKey = `${fromComponentAsset.id}:${connection.fromPointKey.toLowerCase()}`;
    const toKey = `${toComponentAsset.id}:${connection.toPointKey.toLowerCase()}`;

    if (!pointRegistry.has(fromKey)) {
      return NextResponse.json(
        {
          error: `Point "${connection.fromPointKey}" is not registered for "${fromInstance.name}".`,
        },
        { status: 400 }
      );
    }

    if (!pointRegistry.has(toKey)) {
      return NextResponse.json(
        {
          error: `Point "${connection.toPointKey}" is not registered for "${toInstance.name}".`,
        },
        { status: 400 }
      );
    }
  }

  const createdBy =
    session.user.email?.trim() ||
    session.user.name?.trim() ||
    session.user.id;
  const thumbnailUrl = thumbnailDataUrl
    ? await saveWiringTemplateThumbnail(thumbnailDataUrl, {
        name,
        slug: body.slug?.trim() || null,
      })
    : null;

  const builderSavedSetup = (prisma as unknown as {
    builderSavedSetup: BuilderSavedSetupDelegate;
  }).builderSavedSetup;
  const existingSavedSetup = savedSetupId
    ? await builderSavedSetup.findFirst({
        where: {
          id: savedSetupId,
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          publishedAt: true,
          publishedTemplateId: true,
        },
      })
    : null;

  if (savedSetupId && !existingSavedSetup) {
    return NextResponse.json({ error: "Saved setup not found." }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transactionClient = tx as unknown as PublishTransactionClient;
      const existingPublishedTemplateId = existingSavedSetup?.publishedTemplateId ?? null;
      const createdTemplate = existingPublishedTemplateId
        ? await transactionClient.wiringTemplate.update({
            where: {
              id: existingPublishedTemplateId,
            },
            data: {
              name,
              slug: body.slug?.trim() || null,
              description: body.description?.trim() || null,
              thumbnailUrl,
              pickupConfigurationId,
              switchTypeId,
              volumeCount,
              toneCount,
              difficultyLevel: body.difficultyLevel?.trim() || null,
              diagramJson: createDiagramJson(document, roleMap),
              switchLogicJson: createSwitchLogicJson(document, roleMap),
              isVerified: Boolean(body.isVerified),
              sourceType: body.sourceType?.trim() || "Custom Builder",
              sourceUrl: body.sourceUrl?.trim() || null,
              createdBy,
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          })
        : await transactionClient.wiringTemplate.create({
            data: {
              name,
              slug: body.slug?.trim() || null,
              description: body.description?.trim() || null,
              thumbnailUrl,
              pickupConfigurationId,
              switchTypeId,
              volumeCount,
              toneCount,
              difficultyLevel: body.difficultyLevel?.trim() || null,
              diagramJson: createDiagramJson(document, roleMap),
              switchLogicJson: createSwitchLogicJson(document, roleMap),
              isVerified: Boolean(body.isVerified),
              sourceType: body.sourceType?.trim() || "Custom Builder",
              sourceUrl: body.sourceUrl?.trim() || null,
              createdBy,
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          });

      if (existingPublishedTemplateId) {
        await transactionClient.wiringTemplateConnection.deleteMany({
          where: {
            wiringTemplateId: existingPublishedTemplateId,
          },
        });
        await transactionClient.wiringTemplateComponent.deleteMany({
          where: {
            wiringTemplateId: existingPublishedTemplateId,
          },
        });
      }

      await transactionClient.wiringTemplateComponent.createMany({
        data: document.instances.map((instance) => ({
          wiringTemplateId: createdTemplate.id,
          componentRole: roleMap.get(instance.id) ?? instance.id,
          componentType: instance.componentType,
          assetId:
            ((instance.componentAssetId ? assetMap.get(instance.componentAssetId) : null) ??
              assetByOwnerMap.get(instance.assetId))?.id ?? instance.assetId,
          positionX: instance.x,
          positionY: instance.y,
          rotation: instance.rotation,
          scale: instance.scale,
          showLabel: instance.showLabel,
          metadataJson: {
            width: instance.width,
            height: instance.height,
            renderWidth: instance.renderWidth,
            renderHeight: instance.renderHeight,
            originalInstanceId: instance.id,
            labelOffsetX: instance.labelOffsetX,
            labelOffsetY: instance.labelOffsetY,
          } satisfies Prisma.InputJsonValue,
        })),
      });

      await transactionClient.wiringTemplateConnection.createMany({
        data: document.connections.map((connection) => ({
          wiringTemplateId: createdTemplate.id,
          fromComponentRole: roleMap.get(connection.fromInstanceId) ?? connection.fromInstanceId,
          fromPointKey: connection.fromPointKey,
          toComponentRole: roleMap.get(connection.toInstanceId) ?? connection.toInstanceId,
          toPointKey: connection.toPointKey,
          wireTypeId: connection.wireTypeId,
          wireColor: wireTypeMap.get(connection.wireTypeId)?.hexColor ?? null,
          pathJson: createConnectionPathJson(connection),
          label: null,
          notes: null,
        })),
      });

      const savedSetup = existingSavedSetup
        ? await transactionClient.builderSavedSetup.update({
            where: { id: existingSavedSetup.id },
            data: {
              name,
              slug: body.slug?.trim() || null,
              description: body.description?.trim() || null,
              status: "DRAFT",
              documentJson: document as Prisma.InputJsonValue,
              publishedTemplateId: createdTemplate.id,
              publishedAt: existingSavedSetup.publishedAt ?? new Date(),
            },
          })
        : null;

      return {
        template: createdTemplate,
        savedSetup,
      };
    });

    return NextResponse.json(
      {
        template: result.template,
        savedSetup: result.savedSetup ? formatSavedSetupResponse(result.savedSetup) : null,
        publishedCounts: {
          components: document.instances.length,
          connections: document.connections.length,
          shapes: document.shapes.length,
        },
        detectedInventory: inventory,
        detectedTemplate: {
          pickupConfigurationId,
          pickupConfigurationName: pickupConfiguration.name,
          switchTypeId,
          switchTypeName: switchType.name,
          volumeCount,
          toneCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const formattedError = formatPublishDatabaseError(error);
    return NextResponse.json(
      { error: formattedError.message },
      { status: formattedError.status }
    );
  }
}
