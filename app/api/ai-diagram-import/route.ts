import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

type ImportTemplateInput = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  pickupConfigurationId?: string | null;
  switchTypeId?: string | null;
  volumeCount?: number;
  toneCount?: number;
  difficultyLevel?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  createdBy?: string | null;
  isVerified?: boolean;
};

type ImportComponentInput = {
  componentRole?: string;
  componentType?: string;
  assetId?: string;
  positionX?: number;
  positionY?: number;
  rotation?: number;
  metadataJson?: unknown;
};

type ImportConnectionInput = {
  fromComponentRole?: string;
  fromPointKey?: string;
  toComponentRole?: string;
  toPointKey?: string;
  wireTypeId?: string;
  wireColor?: string | null;
  label?: string | null;
  notes?: string | null;
  pathJson?: unknown;
};

type ImportPayload = {
  template?: ImportTemplateInput;
  diagramJson?: unknown;
  switchLogicJson?: unknown;
  components?: ImportComponentInput[];
  connections?: ImportConnectionInput[];
};

function parseImportBody(body: ImportPayload) {
  const template = body.template;
  const components = Array.isArray(body.components) ? body.components : [];
  const connections = Array.isArray(body.connections) ? body.connections : [];

  if (!template) {
    return { error: "template is required." };
  }

  const name = template.name?.trim();
  const slug = template.slug?.trim() || null;
  const description = template.description?.trim() || null;
  const pickupConfigurationId = template.pickupConfigurationId?.trim() || null;
  const switchTypeId = template.switchTypeId?.trim() || null;
  const difficultyLevel = template.difficultyLevel?.trim() || null;
  const sourceType = template.sourceType?.trim() || null;
  const sourceUrl = template.sourceUrl?.trim() || null;
  const createdBy = template.createdBy?.trim() || null;

  if (
    !name ||
    !pickupConfigurationId ||
    !switchTypeId ||
    !createdBy ||
    typeof template.volumeCount !== "number" ||
    typeof template.toneCount !== "number" ||
    template.volumeCount < 0 ||
    template.toneCount < 0
  ) {
    return {
      error:
        "template name, relations, counts, and createdBy are required.",
    };
  }

  if (!body.diagramJson || typeof body.diagramJson !== "object") {
    return { error: "diagramJson must be an object." };
  }

  if (!body.switchLogicJson || typeof body.switchLogicJson !== "object") {
    return { error: "switchLogicJson must be an object." };
  }

  if (!components.length) {
    return { error: "At least one component is required." };
  }

  const normalizedComponents = components.map((component, index) => {
    const componentRole = component.componentRole?.trim();
    const componentType = component.componentType?.trim();
    const assetId = component.assetId?.trim();

    if (
      !componentRole ||
      !componentType ||
      !assetId ||
      typeof component.positionX !== "number" ||
      typeof component.positionY !== "number" ||
      typeof component.rotation !== "number"
    ) {
      throw new Error(
        `components[${index}] requires role, type, assetId, positionX, positionY, and rotation.`
      );
    }

    return {
      componentRole,
      componentType,
      assetId,
      positionX: component.positionX,
      positionY: component.positionY,
      rotation: component.rotation,
      metadataJson:
        component.metadataJson === null || component.metadataJson === undefined
          ? Prisma.JsonNull
          : (component.metadataJson as Prisma.InputJsonValue),
    };
  });

  const normalizedConnections = connections.map((connection, index) => {
    const fromComponentRole = connection.fromComponentRole?.trim();
    const fromPointKey = connection.fromPointKey?.trim();
    const toComponentRole = connection.toComponentRole?.trim();
    const toPointKey = connection.toPointKey?.trim();
    const wireTypeId = connection.wireTypeId?.trim();

    if (
      !fromComponentRole ||
      !fromPointKey ||
      !toComponentRole ||
      !toPointKey ||
      !wireTypeId
    ) {
      throw new Error(
        `connections[${index}] requires component roles, point keys, and wireTypeId.`
      );
    }

    return {
      fromComponentRole,
      fromPointKey,
      toComponentRole,
      toPointKey,
      wireTypeId,
      wireColor: connection.wireColor?.trim() || null,
      label: connection.label?.trim() || null,
      notes: connection.notes?.trim() || null,
      pathJson:
        connection.pathJson === null || connection.pathJson === undefined
          ? Prisma.JsonNull
          : (connection.pathJson as Prisma.InputJsonValue),
    };
  });

  return {
    value: {
      template: {
        name,
        slug,
        description,
        pickupConfigurationId,
        switchTypeId,
        volumeCount: template.volumeCount,
        toneCount: template.toneCount,
        difficultyLevel,
        sourceType,
        sourceUrl,
        createdBy,
        isVerified: Boolean(template.isVerified),
      },
      diagramJson: body.diagramJson as Prisma.InputJsonValue,
      switchLogicJson: body.switchLogicJson as Prisma.InputJsonValue,
      components: normalizedComponents,
      connections: normalizedConnections,
    },
  };
}

export async function POST(request: Request) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  let body: ImportPayload;

  try {
    body = (await request.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed:
    | ReturnType<typeof parseImportBody>["value"]
    | undefined;

  try {
    const result = parseImportBody(body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    parsed = result.value;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid import payload.",
      },
      { status: 400 }
    );
  }

  if (!parsed) {
    return NextResponse.json({ error: "Invalid import payload." }, { status: 400 });
  }

  const [pickupConfiguration, switchType, assets, wireTypes] = await Promise.all([
    prisma.pickupConfiguration.findUnique({
      where: { id: parsed.template.pickupConfigurationId },
      select: { id: true, name: true },
    }),
    prisma.switchType.findUnique({
      where: { id: parsed.template.switchTypeId },
      select: { id: true, name: true },
    }),
    prisma.componentAsset.findMany({
      where: {
        id: {
          in: parsed.components.map((component) => component.assetId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.wireType.findMany({
      where: {
        id: {
          in: parsed.connections.map((connection) => connection.wireTypeId),
        },
      },
      select: {
        id: true,
        name: true,
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
  const wireTypeMap = new Map(wireTypes.map((wireType) => [wireType.id, wireType]));
  const roleMap = new Map(
    parsed.components.map((component) => [component.componentRole.toLowerCase(), component])
  );

  for (const component of parsed.components) {
    if (!assetMap.has(component.assetId)) {
      return NextResponse.json(
        {
          error: `Component asset "${component.assetId}" does not exist.`,
        },
        { status: 400 }
      );
    }
  }

  for (const connection of parsed.connections) {
    if (!wireTypeMap.has(connection.wireTypeId)) {
      return NextResponse.json(
        {
          error: `Wire type "${connection.wireTypeId}" does not exist.`,
        },
        { status: 400 }
      );
    }

    if (!roleMap.has(connection.fromComponentRole.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Unknown fromComponentRole "${connection.fromComponentRole}".`,
        },
        { status: 400 }
      );
    }

    if (!roleMap.has(connection.toComponentRole.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Unknown toComponentRole "${connection.toComponentRole}".`,
        },
        { status: 400 }
      );
    }
  }

  const connectionPointAssetIds = Array.from(
    new Set(parsed.components.map((component) => component.assetId))
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

  for (const connection of parsed.connections) {
    const fromComponent = roleMap.get(connection.fromComponentRole.toLowerCase());
    const toComponent = roleMap.get(connection.toComponentRole.toLowerCase());

    if (!fromComponent || !toComponent) {
      continue;
    }

    const fromKey = `${fromComponent.assetId}:${connection.fromPointKey.toLowerCase()}`;
    const toKey = `${toComponent.assetId}:${connection.toPointKey.toLowerCase()}`;

    if (!pointRegistry.has(fromKey)) {
      return NextResponse.json(
        {
          error: `Point "${connection.fromPointKey}" is not registered for component role "${connection.fromComponentRole}".`,
        },
        { status: 400 }
      );
    }

    if (!pointRegistry.has(toKey)) {
      return NextResponse.json(
        {
          error: `Point "${connection.toPointKey}" is not registered for component role "${connection.toComponentRole}".`,
        },
        { status: 400 }
      );
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.wiringTemplate.create({
        data: {
          name: parsed.template.name,
          slug: parsed.template.slug,
          description: parsed.template.description,
          pickupConfigurationId: parsed.template.pickupConfigurationId,
          switchTypeId: parsed.template.switchTypeId,
          volumeCount: parsed.template.volumeCount,
          toneCount: parsed.template.toneCount,
          difficultyLevel: parsed.template.difficultyLevel,
          diagramJson: parsed.diagramJson,
          switchLogicJson: parsed.switchLogicJson,
          isVerified: parsed.template.isVerified,
          sourceType: parsed.template.sourceType,
          sourceUrl: parsed.template.sourceUrl,
          createdBy: parsed.template.createdBy,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      await tx.wiringTemplateComponent.createMany({
        data: parsed.components.map((component) => ({
          wiringTemplateId: template.id,
          componentRole: component.componentRole,
          componentType: component.componentType,
          assetId: component.assetId,
          positionX: component.positionX,
          positionY: component.positionY,
          rotation: component.rotation,
          metadataJson: component.metadataJson,
        })),
      });

      await tx.wiringTemplateConnection.createMany({
        data: parsed.connections.map((connection) => ({
          wiringTemplateId: template.id,
          fromComponentRole: connection.fromComponentRole,
          fromPointKey: connection.fromPointKey,
          toComponentRole: connection.toComponentRole,
          toPointKey: connection.toPointKey,
          wireTypeId: connection.wireTypeId,
          wireColor: connection.wireColor,
          pathJson: connection.pathJson,
          label: connection.label,
          notes: connection.notes,
        })),
      });

      return template;
    });

    return NextResponse.json(
      {
        template: result,
        importedCounts: {
          components: parsed.components.length,
          connections: parsed.connections.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Template slug already exists. Change the slug and retry." },
        { status: 409 }
      );
    }

    throw error;
  }
}
