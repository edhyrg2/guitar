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

function createDiagramJson(document: BuilderSavedSetupDocument, roleMap: Map<string, string>) {
  return {
    builder: {
      version: document.version,
      selectedWireTypeId: document.selectedWireTypeId,
      shapes: document.shapes,
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
  return {
    builderConnections: document.connections.map((connection) => ({
      fromComponentRole: roleMap.get(connection.fromInstanceId) ?? connection.fromInstanceId,
      fromPointKey: connection.fromPointKey,
      toComponentRole: roleMap.get(connection.toInstanceId) ?? connection.toInstanceId,
      toPointKey: connection.toPointKey,
      wireTypeId: connection.wireTypeId,
    })),
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
  const pickupConfigurationId = body.pickupConfigurationId?.trim();
  const switchTypeId = body.switchTypeId?.trim();
  const savedSetupId = body.savedSetupId?.trim() || null;
  const thumbnailDataUrl = body.thumbnailDataUrl?.trim() || null;
  const volumeCount = body.volumeCount;
  const toneCount = body.toneCount;

  if (
    !name ||
    !pickupConfigurationId ||
    !switchTypeId ||
    typeof volumeCount !== "number" ||
    typeof toneCount !== "number" ||
    volumeCount < 0 ||
    toneCount < 0
  ) {
    return NextResponse.json(
      { error: "Name, configuration, switch type, and counts are required." },
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

  const [pickupConfiguration, switchType, assets, wireTypes] = await Promise.all([
    prisma.pickupConfiguration.findUnique({
      where: { id: pickupConfigurationId },
      select: { id: true, name: true },
    }),
    prisma.switchType.findUnique({
      where: { id: switchTypeId },
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

  if (!pickupConfiguration) {
    return NextResponse.json(
      { error: "pickupConfigurationId does not exist." },
      { status: 400 }
    );
  }

  if (!switchType) {
    return NextResponse.json(
      { error: "switchTypeId does not exist." },
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
      const createdTemplate = await transactionClient.wiringTemplate.create({
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
