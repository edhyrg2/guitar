import type { Prisma } from "@prisma/client";

export type BuilderSavedSetupStatus = "DRAFT" | "PUBLISHED";

export type BuilderSetupInstance = {
  id: string;
  assetId: string;
  componentAssetId: string | null;
  name: string;
  componentType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  renderWidth: number;
  renderHeight: number;
  scale: number;
  rotation: number;
  showLabel: boolean;
};

export type BuilderSetupConnection = {
  id: string;
  fromInstanceId: string;
  fromPointKey: string;
  toInstanceId: string;
  toPointKey: string;
  wireTypeId: string;
  controlPoints: { x: number; y: number }[];
};

export type BuilderSavedSetupDocument = {
  version: 1;
  selectedWireTypeId: string | null;
  instances: BuilderSetupInstance[];
  connections: BuilderSetupConnection[];
};

export type BuilderSavedSetupRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: BuilderSavedSetupStatus;
  documentJson: Prisma.JsonValue;
  publishedTemplateId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeBuilderSavedSetupDocument(
  input: unknown
): BuilderSavedSetupDocument {
  const parsed = input as Partial<BuilderSavedSetupDocument>;
  const rawInstances = Array.isArray(parsed.instances) ? parsed.instances : [];
  const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];

  return {
    version: 1,
    selectedWireTypeId:
      typeof parsed.selectedWireTypeId === "string" && parsed.selectedWireTypeId.trim()
        ? parsed.selectedWireTypeId
        : null,
    instances: rawInstances
      .map((instance) => {
        const value = instance as Partial<BuilderSetupInstance>;

        if (
          typeof value.id !== "string" ||
          typeof value.assetId !== "string" ||
          typeof value.name !== "string" ||
          typeof value.componentType !== "string" ||
          !isFiniteNumber(value.x) ||
          !isFiniteNumber(value.y) ||
          !isFiniteNumber(value.width) ||
          !isFiniteNumber(value.height) ||
          !isFiniteNumber(value.renderWidth) ||
          !isFiniteNumber(value.renderHeight) ||
          !isFiniteNumber(value.scale) ||
          !isFiniteNumber(value.rotation)
        ) {
          return null;
        }

        return {
          id: value.id,
          assetId: value.assetId,
          componentAssetId:
            typeof value.componentAssetId === "string" && value.componentAssetId.trim()
              ? value.componentAssetId
              : null,
          name: value.name,
          componentType: value.componentType,
          x: value.x!,
          y: value.y!,
          width: value.width!,
          height: value.height!,
          renderWidth: value.renderWidth!,
          renderHeight: value.renderHeight!,
          scale: value.scale!,
          rotation: value.rotation!,
          showLabel: Boolean(value.showLabel),
        } satisfies BuilderSetupInstance;
      })
      .filter((instance): instance is BuilderSetupInstance => instance !== null),
    connections: rawConnections
      .map((connection) => {
        const value = connection as Partial<BuilderSetupConnection>;

        if (
          typeof value.id !== "string" ||
          typeof value.fromInstanceId !== "string" ||
          typeof value.fromPointKey !== "string" ||
          typeof value.toInstanceId !== "string" ||
          typeof value.toPointKey !== "string" ||
          typeof value.wireTypeId !== "string" ||
          !Array.isArray(value.controlPoints)
        ) {
          return null;
        }

        const controlPoints = value.controlPoints
          .map((point) => {
            const item = point as { x?: unknown; y?: unknown };

            if (!isFiniteNumber(item.x) || !isFiniteNumber(item.y)) {
              return null;
            }

            return { x: item.x, y: item.y };
          })
          .filter((point): point is { x: number; y: number } => point !== null);

        return {
          id: value.id,
          fromInstanceId: value.fromInstanceId,
          fromPointKey: value.fromPointKey,
          toInstanceId: value.toInstanceId,
          toPointKey: value.toPointKey,
          wireTypeId: value.wireTypeId,
          controlPoints,
        } satisfies BuilderSetupConnection;
      })
      .filter((connection): connection is BuilderSetupConnection => connection !== null),
  };
}
