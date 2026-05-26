import type { Prisma } from "@prisma/client";
import type {
  EllipseObject,
  ImageObject,
  LineObject,
  RectangleObject,
  TextObject,
} from "@/lib/custom-component-editor-types";

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
  labelOffsetX: number;
  labelOffsetY: number;
};

export type BuilderSetupConnection = {
  id: string;
  fromInstanceId: string;
  fromPointKey: string;
  toInstanceId: string;
  toPointKey: string;
  wireTypeId: string;
  controlPoints: { x: number; y: number }[];
  tension: number;
};

export type BuilderSetupShape = RectangleObject | EllipseObject | LineObject | TextObject | ImageObject;

export type BuilderSavedSetupDocument = {
  version: 1;
  selectedWireTypeId: string | null;
  instances: BuilderSetupInstance[];
  connections: BuilderSetupConnection[];
  shapes: BuilderSetupShape[];
};

export type BuilderSavedSetupRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: BuilderSavedSetupStatus;
  documentJson: Prisma.JsonValue;
  thumbnailUrl: string | null;
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
  const rawShapes = Array.isArray(parsed.shapes) ? parsed.shapes : [];

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
          labelOffsetX: isFiniteNumber(value.labelOffsetX) ? value.labelOffsetX! : 0,
          labelOffsetY: isFiniteNumber(value.labelOffsetY) ? value.labelOffsetY! : 0,
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
          tension: typeof (value as { tension?: unknown }).tension === "number" ? (value as { tension: number }).tension : 0,
        } satisfies BuilderSetupConnection;
      })
      .filter((connection): connection is BuilderSetupConnection => connection !== null),
    shapes: rawShapes.reduce<BuilderSetupShape[]>((result, shape) => {
      const value = shape as Partial<BuilderSetupShape>;

      if (
        typeof value.id !== "string" ||
        typeof value.name !== "string" ||
        !isFiniteNumber(value.x) ||
        !isFiniteNumber(value.y) ||
        !isFiniteNumber(value.rotation) ||
        !isFiniteNumber(value.opacity) ||
        typeof value.fill !== "string" ||
        typeof value.stroke !== "string" ||
        !isFiniteNumber(value.strokeWidth) ||
        !isFiniteNumber(value.scaleX) ||
        !isFiniteNumber(value.scaleY) ||
        typeof value.visible !== "boolean" ||
        typeof value.locked !== "boolean"
      ) {
        return result;
      }

      if (value.type === "rectangle") {
        if (
          !isFiniteNumber(value.width) ||
          !isFiniteNumber(value.height) ||
          !isFiniteNumber(value.cornerRadius)
        ) {
          return result;
        }

        result.push({
          id: value.id,
          groupId: value.groupId,
          type: "rectangle",
          name: value.name,
          x: value.x!,
          y: value.y!,
          rotation: value.rotation!,
          opacity: value.opacity!,
          fill: value.fill,
          stroke: value.stroke,
          strokeWidth: value.strokeWidth!,
          scaleX: value.scaleX!,
          scaleY: value.scaleY!,
          visible: value.visible,
          locked: value.locked,
          width: value.width!,
          height: value.height!,
          cornerRadius: value.cornerRadius!,
        });
        return result;
      }

      if (value.type === "ellipse") {
        if (!isFiniteNumber(value.width) || !isFiniteNumber(value.height)) {
          return result;
        }

        result.push({
          id: value.id,
          groupId: value.groupId,
          type: "ellipse",
          name: value.name,
          x: value.x!,
          y: value.y!,
          rotation: value.rotation!,
          opacity: value.opacity!,
          fill: value.fill,
          stroke: value.stroke,
          strokeWidth: value.strokeWidth!,
          scaleX: value.scaleX!,
          scaleY: value.scaleY!,
          visible: value.visible,
          locked: value.locked,
          width: value.width!,
          height: value.height!,
        });
        return result;
      }

      if (
        value.type === "line" &&
        Array.isArray(value.points) &&
        !value.points.some((point) => !isFiniteNumber(point))
      ) {
        result.push({
          id: value.id,
          groupId: value.groupId,
          type: "line",
          name: value.name,
          x: value.x!,
          y: value.y!,
          rotation: value.rotation!,
          opacity: value.opacity!,
          fill: value.fill,
          stroke: value.stroke,
          strokeWidth: value.strokeWidth!,
          scaleX: value.scaleX!,
          scaleY: value.scaleY!,
          visible: value.visible,
          locked: value.locked,
          points: [...value.points],
        });
      }

      if (value.type === "text") {
        if (
          !isFiniteNumber(value.width) ||
          !isFiniteNumber(value.height) ||
          typeof value.text !== "string" ||
          !isFiniteNumber(value.fontSize) ||
          typeof value.fontFamily !== "string" ||
          (value.fontStyle !== "normal" &&
            value.fontStyle !== "bold" &&
            value.fontStyle !== "italic" &&
            value.fontStyle !== "bold italic") ||
          (value.textAlign !== "left" &&
            value.textAlign !== "center" &&
            value.textAlign !== "right")
        ) {
          return result;
        }

        result.push({
          id: value.id,
          groupId: value.groupId,
          type: "text",
          name: value.name,
          x: value.x!,
          y: value.y!,
          rotation: value.rotation!,
          opacity: value.opacity!,
          fill: value.fill,
          stroke: value.stroke,
          strokeWidth: value.strokeWidth!,
          scaleX: value.scaleX!,
          scaleY: value.scaleY!,
          visible: value.visible,
          locked: value.locked,
          width: value.width!,
          height: value.height!,
          text: value.text,
          fontSize: value.fontSize!,
          fontFamily: value.fontFamily,
          fontStyle: value.fontStyle,
          textAlign: value.textAlign,
        });
      }

      if (value.type === "image") {
        const imgValue = value as Partial<import("@/lib/custom-component-editor-types").ImageObject>;
        if (
          !isFiniteNumber(imgValue.width) ||
          !isFiniteNumber(imgValue.height) ||
          typeof imgValue.src !== "string"
        ) {
          return result;
        }

        result.push({
          id: value.id,
          groupId: value.groupId,
          type: "image",
          name: value.name,
          x: value.x!,
          y: value.y!,
          rotation: value.rotation!,
          opacity: value.opacity!,
          fill: value.fill,
          stroke: value.stroke,
          strokeWidth: value.strokeWidth!,
          scaleX: value.scaleX!,
          scaleY: value.scaleY!,
          visible: value.visible,
          locked: value.locked,
          width: imgValue.width!,
          height: imgValue.height!,
          src: imgValue.src,
        });
      }

      return result;
    }, []),
  };
}
