"use client";

import * as React from "react";
import type Konva from "konva";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  Cancel01Icon,
  DatabaseIcon,
  Delete02Icon,
  Download01Icon,
  FloppyDiskIcon,
  Image01Icon,
  Menu01Icon,
  Move01Icon,
  OvalIcon,
  PaintBrush02Icon,
  PlusSignIcon,
  Redo02Icon,
  Rocket01Icon,
  SearchAddIcon,
  SquareIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextIcon,
  SearchMinusIcon,
  Undo02Icon,
  Upload01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Shape,
  Stage,
  Text,
  Transformer,
} from "react-konva";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import {
  normalizeBuilderSavedSetupDocument,
  type BuilderSavedSetupDocument,
  type BuilderSavedSetupRow,
  type BuilderSetupShape,
  type BuilderSavedSetupStatus,
} from "@/lib/custom-builder-saved-setup-types";
import {
  createTextObject,
  createEllipseObject,
  createLineObject,
  createRectangleObject,
  getObjectDimensions,
  withAutoSizedTextDimensions,
} from "@/lib/custom-component-editor-utils";
import type {
  EllipseObject,
  RectangleObject,
  TextObject,
} from "@/lib/custom-component-editor-types";
import type { WiringTemplateReference } from "@/lib/wiring-template-types";
import type { WireTypeRow } from "@/lib/wire-type-types";

export type BuilderAssetDefinition = {
  id: string;
  componentAssetId: string | null;
  componentType: string;
  name: string;
  slug: string | null;
  width: number;
  height: number;
  previewUrl: string | null;
  styleType: string | null;
  connectionPoints: {
    id: string;
    pointKey: string;
    label: string;
    pointType: string;
    color: string | null;
    x: number;
    y: number;
    description: string | null;
  }[];
};

type BuilderInstance = {
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

type BuilderConnection = {
  id: string;
  fromInstanceId: string;
  fromPointKey: string;
  toInstanceId: string;
  toPointKey: string;
  wireTypeId: string;
  controlPoints: { x: number; y: number }[];
  tension: number;
};

type PathSegment = {
  connectionId: string;
  segmentIndex: number;
  orientation: "horizontal" | "vertical";
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type WireBridge = {
  segmentIndex: number;
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
};

type SelectedPoint = {
  instanceId: string;
  pointKey: string;
};

type HoverPointTarget = {
  instanceId: string;
  pointKey: string;
};

type DragConnectionPointState = {
  source: HoverPointTarget;
  connectionId: string;
  endpoint: "from" | "to";
  startWorld: { x: number; y: number };
  moved: boolean;
};

type SelectionBox = {
  start: { x: number; y: number };
  current: { x: number; y: number };
} | null;

type BuilderSnapshot = {
  instances: BuilderInstance[];
  connections: BuilderConnection[];
  shapes: BuilderSetupShape[];
};

type BuilderTool = "select" | "rectangle" | "ellipse" | "line" | "text";

type DraftBuilderShape =
  | {
      tool: "rectangle" | "ellipse" | "line" | "text";
      start: { x: number; y: number };
      current: { x: number; y: number };
      constrainProportions?: boolean;
    }
  | null;

type BuilderLayerEntry =
  | {
      id: string;
      kind: "connection";
      label: string;
      meta: string;
      selected: boolean;
    }
  | {
      id: string;
      kind: "shape";
      label: string;
      meta: string;
      selected: boolean;
    }
  | {
      id: string;
      kind: "instance";
      label: string;
      meta: string;
      selected: boolean;
    };

type BuilderPublishFormState = {
  name: string;
  slug: string;
  description: string;
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string;
  sourceType: string;
  sourceUrl: string;
  isVerified: boolean;
  tags: string;
};

type InlineBuilderTextEditorState = {
  shapeId: string;
  value: string;
  style: React.CSSProperties;
} | null;

type CustomBuilderContentProps = {
  assets: BuilderAssetDefinition[];
  wireTypes: WireTypeRow[];
  pickupConfigurationOptions: WiringTemplateReference[];
  switchTypeOptions: WiringTemplateReference[];
  initialSavedSetupId?: string | null;
};

const INITIAL_MAX_COMPONENT_WIDTH = 280;
const INITIAL_MAX_COMPONENT_HEIGHT = 180;
const CONNECTION_POINT_RADIUS = 3.5;
const CONNECTION_POINT_ACTIVE_RADIUS = 4;
const CONNECTION_POINT_RING_RADIUS = 5;
const CONNECTION_POINT_ACTIVE_RING_RADIUS = 5.75;
const CONNECTION_POINT_HIT_RADIUS = 12;
const CONNECTION_POINT_SNAP_DISTANCE = 10;
const CONNECTION_POINT_SNAP_PRIORITY_DELTA = 6;
const WIRE_HIT_STROKE_WIDTH = 18;
const WIRE_HANDLE_RADIUS = 7;
const WIRE_BRIDGE_RADIUS = 10;
const WIRE_BRIDGE_JOIN_TRIM = 0;
const WIRE_GRID_SIZE = 12;
const GRID_LINE_COLOR = "rgba(148, 163, 184, 0.18)";
const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2.5;
const CANVAS_SCALE_STEP = 0.2;
const MIN_SELECTION_BOX_SIZE = 8;

function isTransparentColor(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "transparent" ||
    normalized === "rgba(0,0,0,0)" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    normalized === "#00000000"
  );
}

function getConstrainedPoint(
  start: { x: number; y: number },
  current: { x: number; y: number }
) {
  const deltaX = current.x - start.x;
  const deltaY = current.y - start.y;
  const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  return {
    x: start.x + Math.sign(deltaX || 1) * size,
    y: start.y + Math.sign(deltaY || 1) * size,
  };
}

function useLoadedImage(src: string | null) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (!src) {
      return;
    }

    const nextImage = new window.Image();
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);
    nextImage.src = src;

    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [src]);

  return src ? image : null;
}

function rotatePoint(x: number, y: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function getInitialScale(width: number, height: number) {
  const widthScale = INITIAL_MAX_COMPONENT_WIDTH / Math.max(width, 1);
  const heightScale = INITIAL_MAX_COMPONENT_HEIGHT / Math.max(height, 1);

  return Math.min(1, widthScale, heightScale);
}

function snapToGrid(value: number) {
  return Math.round(value / WIRE_GRID_SIZE) * WIRE_GRID_SIZE;
}

function snapPointToGrid(point: { x: number; y: number }) {
  return {
    x: snapToGrid(point.x),
    y: snapToGrid(point.y),
  };
}

function createDefaultControlPoints(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const midX = (from.x + to.x) / 2;

  return [
    { x: snapToGrid(midX), y: snapToGrid(from.y) },
    { x: snapToGrid(midX), y: snapToGrid(to.y) },
  ];
}

function straightenConnectionControlPoints(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  return createDefaultControlPoints(from, to);
}

function normalizeConnectionControlPoints(
  controlPoints: { x: number; y: number }[],
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const points = controlPoints.map((point) => snapPointToGrid(point));

  if (points.length > 0) {
    const first = points[0];
    const secondReference = points[1] ?? to;
    const firstToSecondIsVertical = Math.abs(secondReference.x - first.x) < 0.5;

    if (firstToSecondIsVertical) {
      first.x = snapToGrid(first.x);
      first.y = from.y;
    } else {
      first.x = from.x;
      first.y = snapToGrid(first.y);
    }
  }

  if (points.length > 0) {
    const lastIndex = points.length - 1;
    const last = points[lastIndex];
    const previousReference = points[lastIndex - 1] ?? from;
    const previousToLastIsVertical = Math.abs(last.x - previousReference.x) < 0.5;

    if (previousToLastIsVertical) {
      last.x = snapToGrid(last.x);
      last.y = to.y;
    } else {
      last.x = to.x;
      last.y = snapToGrid(last.y);
    }
  }

  return points;
}

function buildPathSegments(
  connectionId: string,
  points: { x: number; y: number }[]
) {
  const segments: PathSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (!start || !end) {
      continue;
    }

    const deltaX = Math.abs(end.x - start.x);
    const deltaY = Math.abs(end.y - start.y);

    if (deltaX < 0.5 && deltaY < 0.5) {
      continue;
    }

    segments.push({
      connectionId,
      segmentIndex: index,
      orientation: deltaX >= deltaY ? "horizontal" : "vertical",
      start,
      end,
    });
  }

  return segments;
}

function getStrictSegmentIntersection(
  first: PathSegment,
  second: PathSegment
) {
  if (first.orientation === second.orientation) {
    return null;
  }

  const horizontal = first.orientation === "horizontal" ? first : second;
  const vertical = first.orientation === "vertical" ? first : second;
  const horizontalMinX = Math.min(horizontal.start.x, horizontal.end.x);
  const horizontalMaxX = Math.max(horizontal.start.x, horizontal.end.x);
  const verticalMinY = Math.min(vertical.start.y, vertical.end.y);
  const verticalMaxY = Math.max(vertical.start.y, vertical.end.y);
  const x = vertical.start.x;
  const y = horizontal.start.y;
  const epsilon = 0.5;

  if (
    x <= horizontalMinX + epsilon ||
    x >= horizontalMaxX - epsilon ||
    y <= verticalMinY + epsilon ||
    y >= verticalMaxY - epsilon
  ) {
    return null;
  }

  return { x, y };
}

function computeWireBridges(
  pathEntries: Array<{ connectionId: string; points: { x: number; y: number }[] }>
) {
  const bridgeMap = new Map<string, WireBridge[]>();
  const allSegments = pathEntries.flatMap((entry) =>
    buildPathSegments(entry.connectionId, entry.points)
  );

  for (const entry of pathEntries) {
    bridgeMap.set(entry.connectionId, []);
  }

  for (let index = 0; index < allSegments.length; index += 1) {
    const first = allSegments[index];

    for (let comparisonIndex = index + 1; comparisonIndex < allSegments.length; comparisonIndex += 1) {
      const second = allSegments[comparisonIndex];

      if (first.connectionId === second.connectionId) {
        continue;
      }

      const intersection = getStrictSegmentIntersection(first, second);

      if (!intersection) {
        continue;
      }

      const bridgeSegment =
        first.orientation === "horizontal"
          ? first
          : second.orientation === "horizontal"
            ? second
            : null;

      if (!bridgeSegment) {
        continue;
      }

      const currentBridges = bridgeMap.get(bridgeSegment.connectionId) ?? [];
      const exists = currentBridges.some(
        (bridge) =>
          bridge.segmentIndex === bridgeSegment.segmentIndex &&
          Math.abs(bridge.x - intersection.x) < 0.5 &&
          Math.abs(bridge.y - intersection.y) < 0.5
      );

      if (exists) {
        continue;
      }

      currentBridges.push({
        segmentIndex: bridgeSegment.segmentIndex,
        x: intersection.x,
        y: intersection.y,
        orientation: bridgeSegment.orientation,
      });
      bridgeMap.set(bridgeSegment.connectionId, currentBridges);
    }
  }

  return bridgeMap;
}

function renderWireSegmentWithBridges(params: {
  connectionId: string;
  segmentIndex: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
  bridges: WireBridge[];
  color: string;
  strokeWidth: number;
}) {
  const { connectionId, segmentIndex, start, end, bridges, color, strokeWidth } = params;
  const deltaX = Math.abs(end.x - start.x);
  const deltaY = Math.abs(end.y - start.y);
  const isHorizontal = deltaX >= deltaY;
  const gapHalfWidth = Math.max(
    WIRE_BRIDGE_RADIUS - strokeWidth / 2 - WIRE_BRIDGE_JOIN_TRIM,
    1
  );
  const segmentBridges = bridges
    .filter((bridge) => bridge.segmentIndex === segmentIndex)
    .sort((left, right) =>
      isHorizontal ? left.x - right.x : left.y - right.y
    );

  if (segmentBridges.length === 0) {
    return (
      <Line
        key={`${connectionId}-segment-visual-${segmentIndex}`}
        name="builder-export-content"
        points={[start.x, start.y, end.x, end.y]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );
  }

  const parts: React.ReactNode[] = [];

  if (isHorizontal) {
    const direction = end.x >= start.x ? 1 : -1;
    let currentX = start.x;

    for (const bridge of segmentBridges) {
      const bridgeStartX = bridge.x - gapHalfWidth * direction;
      const bridgeEndX = bridge.x + gapHalfWidth * direction;

      parts.push(
        <Line
          key={`${connectionId}-segment-visual-${segmentIndex}-${bridge.x}-a`}
          name="builder-export-content"
          points={[currentX, start.y, bridgeStartX, start.y]}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      );

      currentX = bridgeEndX;
    }

    parts.push(
      <Line
        key={`${connectionId}-segment-visual-${segmentIndex}-tail`}
        name="builder-export-content"
        points={[currentX, start.y, end.x, end.y]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );

    return parts;
  }

  const direction = end.y >= start.y ? 1 : -1;
  let currentY = start.y;

  for (const bridge of segmentBridges) {
    const bridgeStartY = bridge.y - gapHalfWidth * direction;
    const bridgeEndY = bridge.y + gapHalfWidth * direction;

    parts.push(
      <Line
        key={`${connectionId}-segment-visual-${segmentIndex}-${bridge.y}-a`}
        name="builder-export-content"
        points={[start.x, currentY, start.x, bridgeStartY]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );

    currentY = bridgeEndY;
  }

  parts.push(
    <Line
      key={`${connectionId}-segment-visual-${segmentIndex}-tail`}
      name="builder-export-content"
      points={[start.x, currentY, end.x, end.y]}
      stroke={color}
      strokeWidth={strokeWidth}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  );

  return parts;
}

function cloneInstances(instances: BuilderInstance[]) {
  return instances.map((instance) => ({ ...instance }));
}

function cloneConnections(connections: BuilderConnection[]) {
  return connections.map((connection) => ({
    ...connection,
    controlPoints: connection.controlPoints.map((point) => ({ ...point })),
  }));
}

function cloneShapes(shapes: BuilderSetupShape[]) {
  return shapes.map((shape) =>
    shape.type === "line"
      ? {
          ...shape,
          points: [...shape.points],
        }
      : { ...shape }
  );
}

function createBuilderSnapshot(
  instances: BuilderInstance[],
  connections: BuilderConnection[],
  shapes: BuilderSetupShape[]
): BuilderSnapshot {
  return {
    instances: cloneInstances(instances),
    connections: cloneConnections(connections),
    shapes: cloneShapes(shapes),
  };
}

function slugifyBuilderSetupName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createBuilderSavedSetupDocument(
  instances: BuilderInstance[],
  connections: BuilderConnection[],
  shapes: BuilderSetupShape[],
  selectedWireTypeId: string | null
): BuilderSavedSetupDocument {
  return {
    version: 1,
    selectedWireTypeId,
    instances: cloneInstances(instances),
    connections: cloneConnections(connections),
    shapes: cloneShapes(shapes),
  };
}

function downloadJsonFile(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugifyJsonFilename(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "builder-setup";
}

function getFilenameBase(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").trim() || "Imported Setup";
}

function getBuilderExportBounds(nodes: Konva.Node[]) {
  if (nodes.length === 0) {
    return null;
  }

  const bounds = nodes
    .map((node) => node.getClientRect({ skipShadow: false, skipStroke: false }))
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (bounds.length === 0) {
    return null;
  }

  const minX = Math.min(...bounds.map((rect) => rect.x));
  const minY = Math.min(...bounds.map((rect) => rect.y));
  const maxX = Math.max(...bounds.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...bounds.map((rect) => rect.y + rect.height));
  const padding = 24;

  return {
    x: Math.max(0, Math.floor(minX - padding)),
    y: Math.max(0, Math.floor(minY - padding)),
    width: Math.ceil(maxX - minX + padding * 2),
    height: Math.ceil(maxY - minY + padding * 2),
  };
}

function formatSavedSetupLifecycleLabel(
  status: BuilderSavedSetupStatus | null,
  publishedTemplateId: string | null
) {
  if (publishedTemplateId) {
    return "draft ï¿½ published";
  }

  if (status === "DRAFT") {
    return "draft";
  }

  return null;
}

function updateConnectionControlPoints(
  connection: BuilderConnection,
  segmentIndex: number,
  axis: "x" | "y",
  delta: number
) {
  const nextControlPoints = connection.controlPoints.map((point) => ({ ...point }));
  const lastSegmentIndex = nextControlPoints.length;

  if (nextControlPoints.length === 0) {
    return nextControlPoints;
  }

  if (segmentIndex === 0) {
    nextControlPoints[0][axis] = snapToGrid(nextControlPoints[0][axis] + delta);
    return nextControlPoints;
  }

  if (segmentIndex === lastSegmentIndex) {
    nextControlPoints.at(-1)![axis] = snapToGrid(nextControlPoints.at(-1)![axis] + delta);
    return nextControlPoints;
  }

  nextControlPoints[segmentIndex - 1][axis] = snapToGrid(
    nextControlPoints[segmentIndex - 1][axis] + delta
  );
  nextControlPoints[segmentIndex][axis] = snapToGrid(
    nextControlPoints[segmentIndex][axis] + delta
  );

  return nextControlPoints;
}

function insertConnectionControlPoint(
  connection: BuilderConnection,
  segmentIndex: number,
  point: { x: number; y: number }
) {
  const nextControlPoints = connection.controlPoints.map((item) => ({ ...item }));
  nextControlPoints.splice(segmentIndex, 0, snapPointToGrid(point));
  return nextControlPoints;
}

function removeConnectionControlPoint(
  connection: BuilderConnection,
  controlPointIndex: number
) {
  return connection.controlPoints.filter((_, index) => index !== controlPointIndex);
}

function BuilderAssetNode({
  asset,
  instance,
  nodeRef,
  isSelected,
  isDeleteMode,
  selectedPoint,
  hoverPointTarget,
  wiringSelectionActive = false,
  renderMode = "full",
  onSelect,
  onDragStart,
  onMove,
  onDragEnd,
  onLabelDragStart,
  onLabelDragMove,
  onLabelDragEnd,
  onImageReady,
  onTransformEnd,
  onContextMenuSelect,
  onPointSelect,
  hasConnectedPoint,
  onPointDragStart,
}: {
  asset: BuilderAssetDefinition;
  instance: BuilderInstance;
  nodeRef: (node: Konva.Group | null) => void;
  isSelected: boolean;
  isDeleteMode: boolean;
  selectedPoint: SelectedPoint | null;
  hoverPointTarget?: HoverPointTarget | null;
  wiringSelectionActive?: boolean;
  hasConnectedPoint: (instanceId: string, pointKey: string) => boolean;
  onPointDragStart: (
    instanceId: string,
    pointKey: string,
    pointer: { x: number; y: number }
  ) => void;
  renderMode?: "full" | "points-only";
  onSelect: (instanceId: string, additive?: boolean) => void;
  onDragStart: (instanceId: string, x: number, y: number) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onLabelDragStart: (instanceId: string) => void;
  onLabelDragMove: (instanceId: string, offsetX: number, offsetY: number) => void;
  onLabelDragEnd: () => void;
  onImageReady: (instanceId: string, renderWidth: number, renderHeight: number) => void;
  onTransformEnd: (
    instanceId: string,
    nextValue: Pick<BuilderInstance, "x" | "y" | "scale" | "rotation">
  ) => void;
  onContextMenuSelect: (instanceId: string) => void;
  onPointSelect: (instanceId: string, pointKey: string) => void;
}) {
  const image = useLoadedImage(asset.previewUrl);
  const sourceWidth = instance.renderWidth;
  const sourceHeight = instance.renderHeight;
  const widthRatio = sourceWidth / Math.max(asset.width, 1);
  const heightRatio = sourceHeight / Math.max(asset.height, 1);
  const markerScale = 1 / Math.max(instance.scale, 0.2);
  const compactPointScale = Math.max(
    0.68,
    Math.min(1, Math.min(sourceWidth, sourceHeight) / 120)
  );
  const pointVisualScale = markerScale * compactPointScale;
  const pointHitScale = markerScale * Math.max(0.62, compactPointScale * 0.9);

  React.useEffect(() => {
    if (!image) {
      return;
    }

    if (
      image.naturalWidth !== instance.renderWidth ||
      image.naturalHeight !== instance.renderHeight
    ) {
      onImageReady(instance.id, image.naturalWidth, image.naturalHeight);
    }
  }, [
    image,
    instance.id,
    instance.renderHeight,
    instance.renderWidth,
    onImageReady,
  ]);

  return (
    <Group
      name="builder-export-content"
      ref={renderMode === "full" ? nodeRef : undefined}
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      scaleX={instance.scale}
      scaleY={instance.scale}
      draggable={renderMode === "full" && !isDeleteMode && !wiringSelectionActive}
      listening={renderMode === "points-only" || !wiringSelectionActive}
      onClick={
        renderMode === "full" && !wiringSelectionActive
          ? (event) =>
              onSelect(
                instance.id,
                event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey
              )
          : undefined
      }
      onTap={
        renderMode === "full" && !wiringSelectionActive ? () => onSelect(instance.id) : undefined
      }
      onDragStart={
        renderMode === "full" && !wiringSelectionActive
          ? (event) => {
              event.cancelBubble = true;
              onDragStart(instance.id, snapToGrid(event.target.x()), snapToGrid(event.target.y()));
            }
          : undefined
      }
      onDragMove={
        renderMode === "full" && !wiringSelectionActive
          ? (event) => {
              event.cancelBubble = true;
              onMove(instance.id, snapToGrid(event.target.x()), snapToGrid(event.target.y()));
            }
          : undefined
      }
      onDragEnd={
        renderMode === "full" && !wiringSelectionActive
          ? (event) => {
              event.cancelBubble = true;
              onDragEnd();
            }
          : undefined
      }
      onContextMenu={
        renderMode === "full" && !wiringSelectionActive
          ? () => {
              onContextMenuSelect(instance.id);
            }
          : undefined
      }
      onTransformEnd={
        renderMode === "full" && !wiringSelectionActive
          ? (event) => {
              onTransformEnd(instance.id, {
                x: snapToGrid(event.target.x()),
                y: snapToGrid(event.target.y()),
                scale: Math.max(0.2, event.target.scaleX()),
                rotation: event.target.rotation(),
              });
            }
          : undefined
      }
    >
      {renderMode === "full" ? (
        <>
          <Rect
            width={sourceWidth}
            height={sourceHeight}
            fill="rgba(0,0,0,0)"
            strokeEnabled={false}
            listening={!wiringSelectionActive}
          />
          {image ? (
            <KonvaImage
              image={image}
              width={sourceWidth}
              height={sourceHeight}
              listening={!wiringSelectionActive}
              shadowColor={isSelected ? "#0f172a" : undefined}
              shadowBlur={isSelected ? 8 : 0}
              shadowOpacity={isSelected ? 0.14 : 0}
              shadowOffsetY={isSelected ? 3 : 0}
            />
          ) : (
            <Rect
              width={sourceWidth}
              height={sourceHeight}
              fill="#e2e8f0"
              cornerRadius={12}
              listening={!wiringSelectionActive}
              stroke={isSelected ? "#0f766e" : "#cbd5e1"}
              strokeWidth={isSelected ? 2 : 1}
            />
          )}
        </>
      ) : null}
      {renderMode === "points-only" ? (
        <Rect
          width={sourceWidth}
          height={sourceHeight}
          fill="rgba(0,0,0,0)"
          strokeEnabled={false}
          listening={false}
        />
      ) : null}
      {(renderMode === "points-only" || !wiringSelectionActive
        ? asset.connectionPoints
        : []
      ).map((point) => {
        const active =
          selectedPoint?.instanceId === instance.id &&
          selectedPoint.pointKey === point.pointKey;
        const hovered =
          hoverPointTarget?.instanceId === instance.id &&
          hoverPointTarget.pointKey === point.pointKey;
        const connected = hasConnectedPoint(instance.id, point.pointKey);
        const visibleRadiusMultiplier = renderMode === "points-only" ? 1.25 : 1;
        const hitRadiusMultiplier = renderMode === "points-only" ? 1.35 : 1;

        return (
          <Group
            key={point.pointKey}
            x={point.x * widthRatio}
            y={point.y * heightRatio}
            onMouseDown={(event) => {
              if (!connected || renderMode !== "points-only") {
                return;
              }

              const stage = event.target.getStage();
              const position = stage?.getPointerPosition();

              if (!position) {
                return;
              }

              event.cancelBubble = true;
              onPointDragStart(instance.id, point.pointKey, {
                x: position.x,
                y: position.y,
              });
            }}
            onClick={(event) => {
              event.cancelBubble = true;
              onPointSelect(instance.id, point.pointKey);
            }}
            onTap={(event) => {
              event.cancelBubble = true;
              onPointSelect(instance.id, point.pointKey);
            }}
          >
            <Circle
              radius={CONNECTION_POINT_HIT_RADIUS * hitRadiusMultiplier * pointHitScale}
              fill="rgba(0,0,0,0.01)"
              strokeEnabled={false}
            />
            <Circle
              radius={
                (active
                  ? CONNECTION_POINT_ACTIVE_RADIUS
                  : hovered
                    ? CONNECTION_POINT_ACTIVE_RADIUS
                    : CONNECTION_POINT_RADIUS) *
                visibleRadiusMultiplier *
                pointVisualScale
              }
              fill={active ? "#f97316" : hovered ? "#fb923c" : point.color ?? "#0f766e"}
              stroke="#ffffff"
              strokeWidth={2 * pointVisualScale}
            />
            <Circle
              radius={
                (active
                  ? CONNECTION_POINT_ACTIVE_RING_RADIUS
                  : hovered
                    ? CONNECTION_POINT_ACTIVE_RING_RADIUS
                    : CONNECTION_POINT_RING_RADIUS) *
                visibleRadiusMultiplier *
                pointVisualScale
              }
              stroke={hovered ? "#fb923c" : point.color ?? "#0f766e"}
              strokeWidth={pointVisualScale}
              dash={[3 * pointVisualScale, 3 * pointVisualScale]}
            />
          </Group>
        );
      })}
      {instance.showLabel ? (
        <Text
          x={instance.labelOffsetX}
          y={sourceHeight + 8 + instance.labelOffsetY}
          text={instance.name}
          fontSize={12 * markerScale}
          fill="#0f172a"
          padding={4 * markerScale}
          width={Math.max(sourceWidth, 120)}
          draggable={renderMode === "full" && !wiringSelectionActive}
          onClick={(event) => {
            event.cancelBubble = true;
            onSelect(instance.id, event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey);
          }}
          onTap={(event) => {
            event.cancelBubble = true;
            onSelect(instance.id);
          }}
          onDragStart={(event) => {
            event.cancelBubble = true;
            onLabelDragStart(instance.id);
          }}
          onDragMove={(event) => {
            event.cancelBubble = true;
            onLabelDragMove(
              instance.id,
              event.target.x(),
              event.target.y() - (sourceHeight + 8)
            );
          }}
          onDragEnd={(event) => {
            event.cancelBubble = true;
            onLabelDragEnd();
          }}
        />
      ) : null}
    </Group>
  );
}

function BuilderImageShapeRenderer({ shape }: { shape: { src: string; width: number; height: number; opacity: number } }) {
  const image = useLoadedImage(shape.src);

  if (!image) {
    return (
      <Rect
        name="builder-export-content"
        width={shape.width}
        height={shape.height}
        fill="#e2e8f0"
        cornerRadius={8}
        opacity={shape.opacity}
      />
    );
  }

  return (
    <KonvaImage
      name="builder-export-content"
      image={image}
      width={shape.width}
      height={shape.height}
      opacity={shape.opacity}
    />
  );
}

function BuilderShapeNode({
  shape,
  nodeRef,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: {
  shape: BuilderSetupShape;
  nodeRef: (node: Konva.Group | null) => void;
  isSelected: boolean;
  onSelect: (shapeId: string, additive?: boolean) => void;
  onDoubleClick: (shapeId: string) => void;
  onDragStart: (shapeId: string) => void;
  onDragMove: (shapeId: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onTransformEnd: (shapeId: string, node: Konva.Group) => void;
}) {
  const dimensions = getObjectDimensions(shape);

  return (
    <Group
      ref={nodeRef}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      scaleX={shape.scaleX}
      scaleY={shape.scaleY}
      visible={shape.visible}
      draggable={!shape.locked}
      onClick={(event) => {
        if (event.evt.button === 2) {
          return;
        }

        event.cancelBubble = true;
        onSelect(shape.id, event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey);
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onSelect(shape.id);
      }}
      onDblClick={(event) => {
        if (shape.type !== "text") {
          return;
        }

        event.cancelBubble = true;
        onDoubleClick(shape.id);
      }}
      onDblTap={(event) => {
        if (shape.type !== "text") {
          return;
        }

        event.cancelBubble = true;
        onDoubleClick(shape.id);
      }}
      onDragStart={() => onDragStart(shape.id)}
      onDragMove={(event) => onDragMove(shape.id, event.target.x(), event.target.y())}
      onDragEnd={() => onDragEnd()}
      onTransformEnd={(event) => onTransformEnd(shape.id, event.target as Konva.Group)}
    >
      {shape.type === "rectangle" ? (
        <Rect
          name="builder-export-content"
          width={shape.width}
          height={shape.height}
          cornerRadius={shape.cornerRadius}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      ) : null}
      {shape.type === "ellipse" ? (
        <Shape
          name="builder-export-content"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
          sceneFunc={(context, renderedShape) => {
            const centerX = shape.width / 2;
            const centerY = shape.height / 2;
            const radiusX = Math.max(shape.width / 2, 1);
            const radiusY = Math.max(shape.height / 2, 1);

            context.beginPath();
            context.save();
            context.translate(centerX, centerY);
            context.scale(radiusX, radiusY);
            context.arc(0, 0, 1, 0, Math.PI * 2, false);
            context.restore();
            context.closePath();
            context.fillStrokeShape(renderedShape);
          }}
        />
      ) : null}
      {shape.type === "line" ? (
        <Line
          name="builder-export-content"
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
          opacity={shape.opacity}
        />
      ) : null}
      {shape.type === "text" ? (
        <>
          <Rect
            name="builder-export-content"
            width={dimensions.width}
            height={dimensions.height}
            fill="rgba(0,0,0,0)"
            strokeEnabled={false}
          />
          <Text
            name="builder-export-content"
            text={shape.text}
            width={dimensions.width}
            height={dimensions.height}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fontStyle={shape.fontStyle ?? "normal"}
            align={shape.textAlign ?? "left"}
            fill={shape.fill}
            stroke={shape.stroke === "transparent" ? undefined : shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            verticalAlign="middle"
          />
        </>
      ) : null}
      {shape.type === "image" ? (
        <BuilderImageShapeRenderer shape={shape} />
      ) : null}
      {isSelected ? (
        <Rect
          name="builder-export-hidden"
          width={dimensions.width}
          height={dimensions.height}
          fill="rgba(0,0,0,0)"
          stroke="#0f766e"
          strokeWidth={1}
          dash={[8, 5]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

function createBuilderShapeFromDraft(draft: NonNullable<DraftBuilderShape>) {
  switch (draft.tool) {
    case "rectangle":
      return createRectangleObject(draft.start, draft.current);
    case "ellipse":
      return createEllipseObject(draft.start, draft.current);
    case "line":
      return createLineObject(draft.start, draft.current);
    case "text": {
      const x = Math.min(draft.start.x, draft.current.x);
      const y = Math.min(draft.start.y, draft.current.y);
      const width = Math.max(180, Math.abs(draft.current.x - draft.start.x));
      const height = Math.max(56, Math.abs(draft.current.y - draft.start.y));

      return createTextObject({ x, y, width, height });
    }
  }
}

function toggleTextFontStyle(
  shape: TextObject,
  style: "bold" | "italic"
): TextObject {
  const currentStyles = new Set(shape.fontStyle.split(" ").filter(Boolean));

  if (style === "bold") {
    if (currentStyles.has("bold")) {
      currentStyles.delete("bold");
    } else {
      currentStyles.add("bold");
    }
  }

  if (style === "italic") {
    if (currentStyles.has("italic")) {
      currentStyles.delete("italic");
    } else {
      currentStyles.add("italic");
    }
  }

  const nextFontStyle = Array.from(currentStyles).join(" ").trim();

  return withAutoSizedTextDimensions({
    ...shape,
    fontStyle:
      nextFontStyle === "" ? "normal" : (nextFontStyle as TextObject["fontStyle"]),
  });
}

function normalizeBuilderPublishText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getBuilderComponentCategory(componentType: string | null | undefined) {
  const normalized = normalizeBuilderPublishText(componentType);

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

function inferBuilderPickupKind(name: string) {
  const normalized = normalizeBuilderPublishText(name);

  if (normalized.includes("humbucker")) {
    return "humbucker";
  }

  if (normalized.includes("single")) {
    return "single";
  }

  return "single";
}

function inferBuilderPotRole(name: string) {
  const normalized = normalizeBuilderPublishText(name);

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

function getBuilderPickupPositionLabel(count: number, index: number) {
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

function moveItemBefore<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (
    draggedIndex < 0 ||
    targetIndex < 0 ||
    draggedIndex === targetIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  const insertionIndex = nextItems.findIndex((item) => item.id === targetId);
  nextItems.splice(insertionIndex < 0 ? nextItems.length : insertionIndex, 0, draggedItem);

  return nextItems;
}

function BuilderTopbar({
  activeTool,
  selectedWireTypeId,
  wireTypes,
  canUndo,
  canRedo,
  zoom,
  canAlign,
  canStraightenWire,
  hasSelectedPoint,
  hasSelection,
  canSaveSetup,
  saveBusy,
  publishBusy,
  currentSetupLabel,
  statusText,
  onToolChange,
  onWireTypeChange,
  onUndo,
  onRedo,
  onAlign,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onCancelWiring,
  onStraightenWire,
  onDeleteSelection,
  onClearCanvas,
  onSave,
  onSaveAs,
  onNewComponent,
  onImportJson,
  onExportJson,
  onPublish,
  onOpenSavedSetups,
  showLeftPanel,
  showRightPanel,
  onToggleLeftPanel,
  onToggleRightPanel,
  onImportImage,
}: {
  activeTool: BuilderTool;
  selectedWireTypeId: string;
  wireTypes: WireTypeRow[];
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  canAlign: boolean;
  canStraightenWire: boolean;
  hasSelectedPoint: boolean;
  hasSelection: boolean;
  canSaveSetup: boolean;
  saveBusy: boolean;
  publishBusy: boolean;
  currentSetupLabel?: string | null;
  statusText?: string | null;
  onToolChange: (tool: BuilderTool) => void;
  onWireTypeChange: (wireTypeId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAlign: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onCancelWiring: () => void;
  onStraightenWire: () => void;
  onDeleteSelection: () => void;
  onClearCanvas: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNewComponent: () => void;
  onImportJson: () => void;
  onExportJson: () => void;
  onPublish: () => void;
  onOpenSavedSetups: () => void;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onImportImage: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleWindowPointerDown() {
      setMenuOpen(false);
    }

    window.addEventListener("pointerdown", handleWindowPointerDown);

    return () => {
      window.removeEventListener("pointerdown", handleWindowPointerDown);
    };
  }, [menuOpen]);

  function runMenuAction(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <div className="relative z-40 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                type="button"
                aria-expanded={menuOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((current) => !current);
                }}
              >
                <HugeiconsIcon
                  icon={Menu01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Menu
              </Button>
              {menuOpen ? (
                <div
                  className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-2xl border border-border/70 bg-background p-2 shadow-xl"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                    onClick={() => runMenuAction(onNewComponent)}
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    New Component
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                    onClick={() => runMenuAction(onOpenSavedSetups)}
                  >
                    <HugeiconsIcon
                      icon={DatabaseIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Open
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canSaveSetup || saveBusy}
                    onClick={() => runMenuAction(onSave)}
                  >
                    <HugeiconsIcon
                      icon={FloppyDiskIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    {saveBusy ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canSaveSetup || saveBusy}
                    onClick={() => runMenuAction(onSaveAs)}
                  >
                    <HugeiconsIcon
                      icon={FloppyDiskIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Save As
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                    onClick={() => runMenuAction(onImportJson)}
                  >
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Import JSON
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                    onClick={() => runMenuAction(onExportJson)}
                  >
                    <HugeiconsIcon
                      icon={Download01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Export JSON
                  </button>
                </div>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!canSaveSetup || publishBusy}
              onClick={onPublish}
            >
              <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} data-icon="inline-start" />
              {publishBusy ? "Publishing..." : "Publish"}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancelWiring} disabled={!hasSelectedPoint}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
              Cancel Wiring
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStraightenWire}
              disabled={!canStraightenWire}
            >
              Straighten Wire
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelection}
              disabled={!hasSelection}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
              Delete Selected
            </Button>
            <Button variant="outline" size="sm" onClick={onClearCanvas}>
              Clear Canvas
            </Button>
            <Button
              variant={showLeftPanel ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleLeftPanel}
            >
              {showLeftPanel ? "Hide Palette" : "Show Palette"}
            </Button>
            <Button
              variant={showRightPanel ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleRightPanel}
            >
              {showRightPanel ? "Hide Panel" : "Show Panel"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {currentSetupLabel ? (
              <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
                Setup: <span className="font-medium text-foreground">{currentSetupLabel}</span>
              </div>
            ) : null}
            {statusText ? (
              <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
                {statusText}
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1 shadow-sm">
              <Button variant="ghost" size="sm" onClick={onZoomOut}>
                <HugeiconsIcon icon={SearchMinusIcon} strokeWidth={2} />
              </Button>
              <button
                type="button"
                onClick={onResetZoom}
                className="min-w-16 rounded-full px-3 py-1 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button variant="ghost" size="sm" onClick={onZoomIn}>
                <HugeiconsIcon icon={SearchAddIcon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card px-1 py-1 shadow-sm">
            {[
              { tool: "select" as const, label: "Select", icon: PlusSignIcon },
              { tool: "rectangle" as const, label: "Rectangle", icon: SquareIcon },
              { tool: "ellipse" as const, label: "Ellipse", icon: OvalIcon },
              { tool: "line" as const, label: "Line", icon: Edit01Icon },
              { tool: "text" as const, label: "Text", icon: TextIcon },
            ].map((item) => (
              <Button
                key={item.tool}
                variant={activeTool === item.tool ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onToolChange(item.tool)}
                title={item.label}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onImportImage}
              title="Import Image"
            >
              <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
            </Button>
          </div>
          <Button variant="secondary" size="sm" disabled={!canUndo} onClick={onUndo}>
            <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} data-icon="inline-start" />
            Undo
          </Button>
          <Button variant="secondary" size="sm" disabled={!canRedo} onClick={onRedo}>
            <HugeiconsIcon icon={Redo02Icon} strokeWidth={2} data-icon="inline-start" />
            Redo
          </Button>
          <AppSelect
            value={selectedWireTypeId}
            onValueChange={onWireTypeChange}
            className="h-9 w-56 px-3 text-sm"
            options={wireTypes.map((wireType) => ({
              value: wireType.id,
              label: wireType.name,
            }))}
          />
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card px-1 py-1 shadow-sm">
            <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("left")}>
              <HugeiconsIcon icon={AlignLeftIcon} strokeWidth={2} />
            </Button>
            <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("center")}>
              <HugeiconsIcon icon={AlignHorizontalCenterIcon} strokeWidth={2} />
            </Button>
            <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("right")}>
              <HugeiconsIcon icon={AlignRightIcon} strokeWidth={2} />
            </Button>
            <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("top")}>
              <HugeiconsIcon icon={AlignTopIcon} strokeWidth={2} />
            </Button>
            <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("middle")}>
              <HugeiconsIcon icon={AlignVerticalCenterIcon} strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canAlign}
              onClick={() => onAlign("bottom")}
            >
              <HugeiconsIcon icon={AlignBottomIcon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomBuilderContent({
  assets,
  wireTypes,
  pickupConfigurationOptions,
  switchTypeOptions,
  initialSavedSetupId = null,
}: CustomBuilderContentProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [instances, setInstances] = React.useState<BuilderInstance[]>([]);
  const [connections, setConnections] = React.useState<BuilderConnection[]>([]);
  const [shapes, setShapes] = React.useState<BuilderSetupShape[]>([]);
  const [activeTool, setActiveTool] = React.useState<BuilderTool>("select");
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(null);
  const [selectedInstanceIds, setSelectedInstanceIds] = React.useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null);
  const [selectedShapeId, setSelectedShapeId] = React.useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = React.useState<string[]>([]);
  const [selectedPoint, setSelectedPoint] = React.useState<SelectedPoint | null>(null);
  const [hoverPointTarget, setHoverPointTarget] = React.useState<HoverPointTarget | null>(null);
  const [dragConnectionPoint, setDragConnectionPoint] =
    React.useState<DragConnectionPointState | null>(null);
  const [selectedWireTypeId, setSelectedWireTypeId] = React.useState<string>(
    wireTypes[0]?.id ?? ""
  );
  const [pastSnapshots, setPastSnapshots] = React.useState<BuilderSnapshot[]>([]);
  const [futureSnapshots, setFutureSnapshots] = React.useState<BuilderSnapshot[]>([]);
  const [assetQuery, setAssetQuery] = React.useState("");
  const [assetComponentTypeFilter, setAssetComponentTypeFilter] = React.useState("all");
  const [canvasMessage, setCanvasMessage] = React.useState(
    "Drag an asset from the left panel to the canvas, then click two connection points to create wiring."
  );
  const [showLeftPanel, setShowLeftPanel] = React.useState(true);
  const [showRightPanel, setShowRightPanel] = React.useState(true);
  const [stageSize, setStageSize] = React.useState({ width: 960, height: 720 });
  const [canvasScale, setCanvasScale] = React.useState(1);
  const [canvasOffset, setCanvasOffset] = React.useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = React.useState<SelectionBox>(null);
  const [draftShape, setDraftShape] = React.useState<DraftBuilderShape>(null);
  const [pointerPosition, setPointerPosition] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [savedSetups, setSavedSetups] = React.useState<BuilderSavedSetupRow[]>([]);
  const [activeSavedSetupId, setActiveSavedSetupId] = React.useState<string | null>(null);
  const [activeSavedSetupName, setActiveSavedSetupName] = React.useState<string | null>(null);
  const [savedSetupStatus, setSavedSetupStatus] = React.useState<BuilderSavedSetupStatus | null>(
    null
  );
  const [activePublishedTemplateId, setActivePublishedTemplateId] = React.useState<string | null>(
    null
  );
  const [draggedLayer, setDraggedLayer] = React.useState<{
    id: string;
    kind: BuilderLayerEntry["kind"];
  } | null>(null);
  const [savedSetupDescription, setSavedSetupDescription] = React.useState("");
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [saveDialogMode, setSaveDialogMode] = React.useState<"save" | "saveAs">("save");
  const [savedSetupBrowserOpen, setSavedSetupBrowserOpen] = React.useState(false);
  const [savedSetupBrowserQuery, setSavedSetupBrowserQuery] = React.useState("");
  const [inlineTextEditor, setInlineTextEditor] =
    React.useState<InlineBuilderTextEditorState>(null);
  const [setupNameInput, setSetupNameInput] = React.useState("");
  const [setupDescriptionInput, setSetupDescriptionInput] = React.useState("");
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = React.useState<string | null>(null);
  const [publishForm, setPublishForm] = React.useState<BuilderPublishFormState>({
    name: "",
    slug: "",
    description: "",
    pickupConfigurationId: pickupConfigurationOptions[0]?.id ?? "",
    switchTypeId: switchTypeOptions[0]?.id ?? "",
    volumeCount: 1,
    toneCount: 1,
    difficultyLevel: "",
    sourceType: "Custom Builder",
    sourceUrl: "",
    isVerified: false,
    tags: "",
  });
  const [isSavingSetup, setIsSavingSetup] = React.useState(false);
  const [isLoadingSavedSetups, setIsLoadingSavedSetups] = React.useState(false);
  const [savedSetupActionId, setSavedSetupActionId] = React.useState<string | null>(null);
  const deferredAssetQuery = React.useDeferredValue(assetQuery);
  const importJsonInputRef = React.useRef<HTMLInputElement | null>(null);
  const importImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const stageWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const transformerRef = React.useRef<Konva.Transformer | null>(null);
  const shapeTransformerRef = React.useRef<Konva.Transformer | null>(null);
  const nodeRefs = React.useRef(new Map<string, Konva.Group>());
  const shapeNodeRefs = React.useRef(new Map<string, Konva.Group>());
  const dragSelectionRef = React.useRef<{
    lastX: number;
    lastY: number;
    selectedIds: string[];
  } | null>(null);
  const panDragRef = React.useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const suppressPointSelectionRef = React.useRef(false);
  const inlineTextEditorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const hoverPointTargetRef = React.useRef<HoverPointTarget | null>(null);
  const dragConnectionPointRef = React.useRef<DragConnectionPointState | null>(null);
  const transformSelectionRef = React.useRef<
    Map<
      string,
      {
        x: number;
        y: number;
        scale: number;
        rotation: number;
      }
    >
  >(new Map());
  const selectionAdditiveRef = React.useRef(false);
  const clipboardRef = React.useRef<BuilderInstance[]>([]);
  const isRestoringHistoryRef = React.useRef(false);
  const lastSnapshotRef = React.useRef<BuilderSnapshot | null>(null);
  const latestInstancesRef = React.useRef<BuilderInstance[]>([]);
  const latestConnectionsRef = React.useRef<BuilderConnection[]>([]);
  const latestShapesRef = React.useRef<BuilderSetupShape[]>([]);
  const historyTransactionDepthRef = React.useRef(0);
  const historyTransactionSnapshotRef = React.useRef<BuilderSnapshot | null>(null);
  const initialSavedSetupLoadRef = React.useRef<string | null>(null);
  const stageRef = React.useRef<Konva.Stage | null>(null);
  const nextIdRef = React.useRef(1);
  const worldViewportWidth = stageSize.width / canvasScale;
  const worldViewportHeight = stageSize.height / canvasScale;
  const visibleWorldMinX = -canvasOffset.x / canvasScale;
  const visibleWorldMinY = -canvasOffset.y / canvasScale;
  const visibleWorldMaxX = visibleWorldMinX + worldViewportWidth;
  const visibleWorldMaxY = visibleWorldMinY + worldViewportHeight;
  const canPersistSavedSetups = sessionStatus === "authenticated";
  latestInstancesRef.current = instances;
  latestConnectionsRef.current = connections;
  latestShapesRef.current = shapes;
  hoverPointTargetRef.current = hoverPointTarget;
  dragConnectionPointRef.current = dragConnectionPoint;

  React.useEffect(() => {
    const element = stageWrapperRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setStageSize({
        width: Math.max(element.clientWidth, 420),
        height: Math.max(element.clientHeight, 560),
      });
    });

    observer.observe(element);
    setStageSize({
      width: Math.max(element.clientWidth, 420),
      height: Math.max(element.clientHeight, 560),
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inlineTextEditorRef.current) {
      return;
    }

    inlineTextEditorRef.current.focus();
    inlineTextEditorRef.current.select();
  }, [inlineTextEditor]);

  const assetComponentTypes = React.useMemo(
    () =>
      Array.from(new Set(assets.map((asset) => asset.componentType)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [assets]
  );

  const filteredAssets = assets.filter((asset) => {
    const haystack = [
      asset.name,
      asset.componentType,
      asset.slug,
      asset.styleType,
      ...asset.connectionPoints.map((point) => point.label),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = haystack.includes(deferredAssetQuery.trim().toLowerCase());
    const matchesType =
      assetComponentTypeFilter === "all" ||
      asset.componentType === assetComponentTypeFilter;

    return matchesQuery && matchesType;
  });

  const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  const selectedInstances = React.useMemo(
    () => instances.filter((instance) => selectedInstanceIds.includes(instance.id)),
    [instances, selectedInstanceIds]
  );
  const selectedShape = shapes.find((shape) => shape.id === selectedShapeId) ?? null;
  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ?? null;
  const filteredSavedSetups = React.useMemo(() => {
    if (!savedSetupBrowserQuery) return savedSetups;
    const q = savedSetupBrowserQuery.toLowerCase();
    return savedSetups.filter((s) =>
      [s.name, s.description ?? "", s.slug ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [savedSetups, savedSetupBrowserQuery]);
  const publishCanvasInventory = React.useMemo(() => {
    const pickups = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "pickup")
      .sort((left, right) => left.x - right.x)
      .map((instance, index, collection) => ({
        role: getBuilderPickupPositionLabel(collection.length, index),
        name: instance.name,
        kind: inferBuilderPickupKind(instance.name),
      }));
    const potentiometers = instances
      .filter(
        (instance) => getBuilderComponentCategory(instance.componentType) === "potentiometer"
      )
      .map((instance) => ({
        role: inferBuilderPotRole(instance.name),
        name: instance.name,
      }));
    const switches = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "switch")
      .map((instance) => instance.name);
    const capacitors = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "capacitor")
      .map((instance) => instance.name);
    const resistors = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "resistor")
      .map((instance) => instance.name);
    const outputs = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "output")
      .map((instance) => instance.name);
    const mods = instances
      .filter((instance) => getBuilderComponentCategory(instance.componentType) === "mod")
      .map((instance) => instance.name);
    const volumeCount = potentiometers.filter((item) => item.role === "volume").length;
    const toneCount = potentiometers.filter((item) => item.role === "tone").length;

    return {
      pickups,
      potentiometers,
      switches,
      capacitors,
      resistors,
      outputs,
      mods,
      volumeCount,
      toneCount,
    };
  }, [instances]);
  const derivedPublishValues = React.useMemo(() => {
    const pickupKindsCode = publishCanvasInventory.pickups
      .map((item) => (item.kind === "humbucker" ? "h" : "s"))
      .join("");
    const pickupConfigurationId =
      pickupConfigurationOptions.find((option) => {
        const normalizedName = normalizeBuilderPublishText(option.name);

        if (publishCanvasInventory.pickups.length === 3 && pickupKindsCode === "sss") {
          return normalizedName.includes("three single coil");
        }

        if (publishCanvasInventory.pickups.length === 2 && pickupKindsCode === "hh") {
          return normalizedName.includes("dual humbucker");
        }

        if (publishCanvasInventory.pickups.length === 2 && pickupKindsCode === "ss") {
          return normalizedName.includes("dual single coil");
        }

        if (publishCanvasInventory.pickups.length === 3 && pickupKindsCode === "hsh") {
          return normalizedName.includes("humbucker single humbucker");
        }

        return false;
      })?.id ?? pickupConfigurationOptions[0]?.id ?? "";
    const switchTypeId =
      switchTypeOptions.find((option) => {
        const normalizedName = normalizeBuilderPublishText(option.name);

        return publishCanvasInventory.switches.some((item) =>
          normalizeBuilderPublishText(item).includes(normalizedName)
        );
      })?.id ?? switchTypeOptions[0]?.id ?? "";

    return {
      pickupConfigurationId,
      switchTypeId,
      volumeCount: publishCanvasInventory.volumeCount,
      toneCount: publishCanvasInventory.toneCount,
    };
  }, [pickupConfigurationOptions, publishCanvasInventory, switchTypeOptions]);
  const connectionRenderData = React.useMemo(() => {
    const dragPreviewPoint =
      dragConnectionPoint && pointerPosition
        ? hoverPointTarget
          ? getPoint(hoverPointTarget.instanceId, hoverPointTarget.pointKey)
          : pointerPosition
        : null;
    const entries = connections
      .map((connection) => {
        const draggingSourcePoint =
          dragConnectionPoint &&
          connection.id === dragConnectionPoint.connectionId &&
          dragConnectionPoint.endpoint === "from" &&
          connection.fromInstanceId === dragConnectionPoint.source.instanceId &&
          connection.fromPointKey === dragConnectionPoint.source.pointKey;
        const draggingTargetPoint =
          dragConnectionPoint &&
          connection.id === dragConnectionPoint.connectionId &&
          dragConnectionPoint.endpoint === "to" &&
          connection.toInstanceId === dragConnectionPoint.source.instanceId &&
          connection.toPointKey === dragConnectionPoint.source.pointKey;
        const from =
          draggingSourcePoint && dragPreviewPoint
            ? dragPreviewPoint
            : getPoint(connection.fromInstanceId, connection.fromPointKey);
        const to =
          draggingTargetPoint && dragPreviewPoint
            ? dragPreviewPoint
            : getPoint(connection.toInstanceId, connection.toPointKey);

        if (!from || !to) {
          return null;
        }

        const renderedControlPoints = connection.tension > 0
          ? connection.controlPoints
          : normalizeConnectionControlPoints(
              connection.controlPoints,
              from,
              to
            );
        const pathPoints = [from, ...renderedControlPoints, to];

        return {
          connection,
          pathPoints,
          color:
            wireTypes.find((item) => item.id === connection.wireTypeId)?.hexColor ?? "#334155",
        };
      })
      .filter(
        (
          entry
        ): entry is {
          connection: BuilderConnection;
          pathPoints: { x: number; y: number }[];
          color: string;
        } => Boolean(entry)
      );
    const bridgeMap = computeWireBridges(
      entries.map((entry) => ({
        connectionId: entry.connection.id,
        points: entry.pathPoints,
      }))
    );

    return entries.map((entry) => ({
      ...entry,
      bridges: bridgeMap.get(entry.connection.id) ?? [],
    }));
  }, [
    connections,
    dragConnectionPoint,
    hoverPointTarget,
    instances,
    pointerPosition,
    wireTypes,
  ]);
  const visibleLayers = React.useMemo<BuilderLayerEntry[]>(
    () => [
      ...[...connections].reverse().map((connection) => ({
        id: connection.id,
        kind: "connection" as const,
        label:
          wireTypes.find((item) => item.id === connection.wireTypeId)?.name ?? "Wire",
        meta: "wiring",
        selected: selectedConnectionId === connection.id,
      })),
      ...[...shapes].reverse().map((shape) => ({
        id: shape.id,
        kind: "shape" as const,
        label: shape.name,
        meta: shape.type,
        selected: selectedShapeIds.includes(shape.id),
      })),
      ...[...instances].reverse().map((instance) => ({
        id: instance.id,
        kind: "instance" as const,
        label: instance.name,
        meta: instance.componentType,
        selected: selectedInstanceIds.includes(instance.id),
      })),
    ],
    [
      connections,
      instances,
      selectedConnectionId,
      selectedInstanceIds,
      selectedShapeIds,
      shapes,
      wireTypes,
    ]
  );
  const persistedDocument = React.useMemo(
    () =>
      createBuilderSavedSetupDocument(
        instances,
        connections,
        shapes,
        selectedWireTypeId || null
      ),
    [connections, instances, selectedWireTypeId, shapes]
  );

  const persistSavedSetupListEntry = React.useCallback((nextSetup: BuilderSavedSetupRow) => {
    setSavedSetups((current) => {
      const remaining = current.filter((item) => item.id !== nextSetup.id);
      return [nextSetup, ...remaining].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
  }, []);
  const handleImageReady = React.useEffectEvent(
    (instanceId: string, renderWidth: number, renderHeight: number) => {
      setInstances((current) => {
        const nextInstances = current.map((item) => {
          if (item.id !== instanceId) {
            return item;
          }

          const previousScale = item.scale;
          const previousInitialScale = getInitialScale(item.renderWidth, item.renderHeight);
          const nextInitialScale = getInitialScale(renderWidth, renderHeight);
          const nextScale =
            Math.abs(previousScale - previousInitialScale) < 0.001
              ? nextInitialScale
              : previousScale;

          return {
            ...item,
            renderWidth,
            renderHeight,
            scale: nextScale,
          };
        });

        setConnections((currentConnections) =>
          currentConnections.map((connection) =>
            connection.fromInstanceId === instanceId || connection.toInstanceId === instanceId
              ? normalizeConnectionForInstances(connection, nextInstances)
              : connection
          )
        );

        return nextInstances;
      });
    }
  );
  const handleConnectionSegmentDrag = React.useEffectEvent(
    (
      connectionId: string,
      segmentIndex: number,
      axis: "x" | "y",
      delta: number
    ) => {
      const snappedDelta = snapToGrid(delta);

      if (Math.abs(snappedDelta) < 0.5) {
        return;
      }

      setConnections((current) =>
        current.map((connection) => {
          if (connection.id !== connectionId) {
            return connection;
          }

          const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
          const to = getPoint(connection.toInstanceId, connection.toPointKey);

          if (!from || !to) {
            return connection;
          }

          return {
            ...connection,
            controlPoints: normalizeConnectionControlPoints(
              updateConnectionControlPoints(connection, segmentIndex, axis, snappedDelta),
              from,
              to
            ),
          };
        })
      );
    }
  );
  const handleConnectionControlPointDrag = React.useEffectEvent(
    (connectionId: string, controlPointIndex: number, x: number, y: number) => {
      setConnections((current) =>
        current.map((connection) => {
          if (connection.id !== connectionId) {
            return connection;
          }

          const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
          const to = getPoint(connection.toInstanceId, connection.toPointKey);

          if (!from || !to) {
            return connection;
          }

          // Curved wires: free movement without orthogonal normalization
          if (connection.tension > 0) {
            return {
              ...connection,
              controlPoints: connection.controlPoints.map((point, index) =>
                index === controlPointIndex ? snapPointToGrid({ x, y }) : point
              ),
            };
          }

          return {
            ...connection,
            controlPoints: normalizeConnectionControlPoints(
              connection.controlPoints.map((point, index) =>
                index === controlPointIndex ? snapPointToGrid({ x, y }) : point
              ),
              from,
              to
            ),
          };
        })
      );
    }
  );
  const handleConnectionControlPointRemove = React.useEffectEvent(
    (connectionId: string, controlPointIndex: number) => {
      setConnections((current) =>
        current.map((connection) => {
          if (connection.id !== connectionId) {
            return connection;
          }

          const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
          const to = getPoint(connection.toInstanceId, connection.toPointKey);

          if (!from || !to) {
            return connection;
          }

          return {
            ...connection,
            controlPoints: normalizeConnectionControlPoints(
              removeConnectionControlPoint(connection, controlPointIndex),
              from,
              to
            ),
          };
        })
      );
    }
  );
  const handleConnectionSegmentInsert = React.useEffectEvent(
    (connectionId: string, segmentIndex: number, point: { x: number; y: number }) => {
      setConnections((current) =>
        current.map((connection) => {
          if (connection.id !== connectionId) {
            return connection;
          }

          const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
          const to = getPoint(connection.toInstanceId, connection.toPointKey);

          if (!from || !to) {
            return connection;
          }

          return {
            ...connection,
            controlPoints: normalizeConnectionControlPoints(
              insertConnectionControlPoint(connection, segmentIndex, point),
              from,
              to
            ),
          };
        })
      );
    }
  );

  React.useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    if (selectedInstanceIds.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedInstanceIds
      .map((instanceId) => nodeRefs.current.get(instanceId))
      .filter((node): node is Konva.Group => Boolean(node));

    if (nodes.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [instances, selectedInstanceIds]);

  React.useEffect(() => {
    function handleWindowMouseUp() {
      panDragRef.current = null;

      if (dragConnectionPointRef.current) {
        dragConnectionPointRef.current = null;
        setDragConnectionPoint(null);
        hoverPointTargetRef.current = null;
        setHoverPointTarget(null);
      }
    }

    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  React.useEffect(() => {
    const transformer = shapeTransformerRef.current;

    if (!transformer) {
      return;
    }

    if (selectedShapeIds.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedShapeIds
      .map((shapeId) => shapeNodeRefs.current.get(shapeId))
      .filter((node): node is Konva.Group => Boolean(node));

    if (nodes.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedShapeIds, shapes]);

  React.useEffect(() => {
    const snapshot = createBuilderSnapshot(instances, connections, shapes);

    if (lastSnapshotRef.current === null) {
      lastSnapshotRef.current = snapshot;
      return;
    }

    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      lastSnapshotRef.current = snapshot;
      return;
    }

    if (historyTransactionDepthRef.current > 0) {
      return;
    }

    const previousSnapshot = lastSnapshotRef.current;
    const previousSerialized = JSON.stringify(previousSnapshot);
    const currentSerialized = JSON.stringify(snapshot);

    if (previousSerialized === currentSerialized) {
      return;
    }

    setPastSnapshots((current) => [...current, previousSnapshot].slice(-80));
    setFutureSnapshots([]);
    lastSnapshotRef.current = snapshot;
  }, [connections, instances, shapes]);

  function getCurrentSnapshot() {
    return createBuilderSnapshot(
      latestInstancesRef.current,
      latestConnectionsRef.current,
      latestShapesRef.current
    );
  }

  function beginHistoryTransaction() {
    if (historyTransactionDepthRef.current === 0) {
      historyTransactionSnapshotRef.current =
        lastSnapshotRef.current ?? getCurrentSnapshot();
    }

    historyTransactionDepthRef.current += 1;
  }

  function commitHistoryTransaction() {
    if (historyTransactionDepthRef.current === 0) {
      return;
    }

    historyTransactionDepthRef.current -= 1;

    if (historyTransactionDepthRef.current > 0) {
      return;
    }

    const previousSnapshot = historyTransactionSnapshotRef.current;
    const currentSnapshot = getCurrentSnapshot();
    historyTransactionSnapshotRef.current = null;

    if (!previousSnapshot) {
      lastSnapshotRef.current = currentSnapshot;
      return;
    }

    if (JSON.stringify(previousSnapshot) === JSON.stringify(currentSnapshot)) {
      lastSnapshotRef.current = currentSnapshot;
      return;
    }

    setPastSnapshots((current) => [...current, previousSnapshot].slice(-80));
    setFutureSnapshots([]);
    lastSnapshotRef.current = currentSnapshot;
  }

  function getAsset(assetId: string): BuilderAssetDefinition | null {
    const found = assets.find((asset) =>
      asset.id === assetId ||
      asset.componentAssetId === assetId ||
      (asset.slug && asset.slug === assetId)
    );
    if (found) return found;

    // Fallback: create a minimal asset definition from instance data
    const instance = instances.find((i) => i.assetId === assetId);
    if (instance) {
      const width = instance.renderWidth || 180;
      const height = instance.renderHeight || 120;
      const connectionPoints = (() => {
        if (instance.componentType === "Pickup") {
          return [
            { id: `${assetId}-hot`, pointKey: "hot", label: "Hot", pointType: "Hot", color: "#ef4444", x: width, y: height * 0.35, description: null },
            { id: `${assetId}-ground`, pointKey: "ground", label: "Ground", pointType: "Ground", color: "#111827", x: width, y: height * 0.65, description: null },
          ];
        }
        if (instance.componentType === "Switch") {
          return [
            { id: `${assetId}-lug1`, pointKey: "lug1", label: "Lug 1", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.2, description: null },
            { id: `${assetId}-lug2`, pointKey: "lug2", label: "Lug 2", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.38, description: null },
            { id: `${assetId}-lug3`, pointKey: "lug3", label: "Lug 3", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.56, description: null },
            { id: `${assetId}-lug4`, pointKey: "lug4", label: "Lug 4", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.74, description: null },
            { id: `${assetId}-common`, pointKey: "common", label: "Common", pointType: "Common", color: "#22c55e", x: width, y: height * 0.5, description: null },
            { id: `${assetId}-ground`, pointKey: "ground", label: "Ground", pointType: "Ground", color: "#111827", x: width, y: height * 0.8, description: null },
          ];
        }
        if (instance.componentType === "Potentiometer") {
          return [
            { id: `${assetId}-lug1`, pointKey: "lug1", label: "Lug 1", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.25, description: null },
            { id: `${assetId}-lug2`, pointKey: "lug2", label: "Lug 2", pointType: "Lug", color: "#22c55e", x: 0, y: height * 0.5, description: null },
            { id: `${assetId}-lug3`, pointKey: "lug3", label: "Lug 3", pointType: "Lug", color: "#f97316", x: 0, y: height * 0.75, description: null },
            { id: `${assetId}-case-ground`, pointKey: "case-ground", label: "Case Ground", pointType: "Ground", color: "#111827", x: width, y: height * 0.82, description: null },
          ];
        }
        if (instance.componentType === "Output Jack") {
          return [
            { id: `${assetId}-tip`, pointKey: "tip", label: "Tip", pointType: "Output", color: "#22c55e", x: 0, y: height * 0.35, description: null },
            { id: `${assetId}-sleeve`, pointKey: "sleeve", label: "Sleeve", pointType: "Ground", color: "#111827", x: 0, y: height * 0.65, description: null },
          ];
        }
        if (instance.componentType === "Ground Bus") {
          return [
            { id: `${assetId}-ground`, pointKey: "ground", label: "Ground", pointType: "Ground", color: "#111827", x: width * 0.5, y: height * 0.5, description: null },
          ];
        }
        return [];
      })();

      return {
        id: assetId,
        componentAssetId: instance.componentAssetId ?? assetId,
        componentType: instance.componentType,
        name: instance.name,
        slug: null,
        width,
        height,
        previewUrl: null,
        styleType: null,
        connectionPoints,
      };
    }

    return null;
  }

  function getPointForInstances(
    sourceInstances: BuilderInstance[],
    instanceId: string,
    pointKey: string
  ) {
    const instance = sourceInstances.find((item) => item.id === instanceId);

    if (!instance) {
      return null;
    }

    const asset = getAsset(instance.assetId);
    const point = asset?.connectionPoints.find((item) => item.pointKey === pointKey);

    if (!asset || !point) {
      return null;
    }

    const widthRatio = instance.renderWidth / Math.max(asset.width, 1);
    const heightRatio = instance.renderHeight / Math.max(asset.height, 1);
    const rotatedPoint = rotatePoint(
      point.x * widthRatio * instance.scale,
      point.y * heightRatio * instance.scale,
      instance.rotation
    );

    return {
      x: instance.x + rotatedPoint.x,
      y: instance.y + rotatedPoint.y,
      label: point.label,
      pointType: point.pointType,
    };
  }

  function normalizeConnectionForInstances(
    connection: BuilderConnection,
    sourceInstances: BuilderInstance[]
  ) {
    const from = getPointForInstances(
      sourceInstances,
      connection.fromInstanceId,
      connection.fromPointKey
    );
    const to = getPointForInstances(
      sourceInstances,
      connection.toInstanceId,
      connection.toPointKey
    );

    if (!from || !to) {
      return connection;
    }

    return {
      ...connection,
      controlPoints: normalizeConnectionControlPoints(connection.controlPoints, from, to),
    };
  }

  function getPoint(instanceId: string, pointKey: string) {
    return getPointForInstances(instances, instanceId, pointKey);
  }

  function hasConnectedPoint(instanceId: string, pointKey: string) {
    return connections.some(
      (connection) =>
        (connection.fromInstanceId === instanceId &&
          connection.fromPointKey === pointKey) ||
        (connection.toInstanceId === instanceId && connection.toPointKey === pointKey)
    );
  }

  function getNearestConnectionPointTarget(
    pointer: { x: number; y: number },
    sourcePoint?: HoverPointTarget | null
  ) {
    const activeSource = sourcePoint ?? selectedPoint;

    if (!activeSource) {
      return null;
    }

    let nearestTarget: (HoverPointTarget & { distance: number }) | null = null;
    let currentHoverDistance: number | null = null;

    for (const instance of instances) {
      const asset = getAsset(instance.assetId);

      if (!asset) {
        continue;
      }

      for (const point of asset.connectionPoints) {
        if (
          instance.id === activeSource.instanceId &&
          point.pointKey === activeSource.pointKey
        ) {
          continue;
        }

        const resolvedPoint = getPointForInstances(instances, instance.id, point.pointKey);

        if (!resolvedPoint) {
          continue;
        }

        const distance = Math.hypot(
          resolvedPoint.x - pointer.x,
          resolvedPoint.y - pointer.y
        );

        if (
          hoverPointTarget?.instanceId === instance.id &&
          hoverPointTarget.pointKey === point.pointKey
        ) {
          currentHoverDistance = distance;
        }

        if (
          distance <= CONNECTION_POINT_SNAP_DISTANCE &&
          (!nearestTarget || distance < nearestTarget.distance)
        ) {
          nearestTarget = {
            instanceId: instance.id,
            pointKey: point.pointKey,
            distance,
          };
        }
      }
    }

    if (!nearestTarget) {
      return null;
    }

    if (
      hoverPointTarget &&
      currentHoverDistance !== null &&
      currentHoverDistance <= CONNECTION_POINT_SNAP_DISTANCE &&
      nearestTarget.instanceId !== hoverPointTarget.instanceId &&
      nearestTarget.pointKey !== hoverPointTarget.pointKey &&
      nearestTarget.distance >=
        Math.max(0, currentHoverDistance - CONNECTION_POINT_SNAP_PRIORITY_DELTA)
    ) {
      return hoverPointTarget;
    }

    return {
      instanceId: nearestTarget.instanceId,
      pointKey: nearestTarget.pointKey,
    };
  }

  function applySnapshot(snapshot: BuilderSnapshot) {
    isRestoringHistoryRef.current = true;
    setInstances(cloneInstances(snapshot.instances));
    setConnections(cloneConnections(snapshot.connections));
    setShapes(cloneShapes(snapshot.shapes));
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    setSelectedPoint(null);
    setHoverPointTarget(null);
    setDragConnectionPoint(null);
    setSelectionBox(null);
    setDraftShape(null);
    dragSelectionRef.current = null;
    transformSelectionRef.current.clear();
    historyTransactionDepthRef.current = 0;
    historyTransactionSnapshotRef.current = null;
  }

  function applySavedSetupDocument(document: BuilderSavedSetupDocument) {
    const normalized = normalizeBuilderSavedSetupDocument(document);
    const nextInstances = cloneInstances(normalized.instances);
    const nextConnections = cloneConnections(normalized.connections).filter((connection) => {
      const fromExists = nextInstances.some((instance) => instance.id === connection.fromInstanceId);
      const toExists = nextInstances.some((instance) => instance.id === connection.toInstanceId);
      return fromExists && toExists;
    });
    const maxInstanceSequence = nextInstances.reduce((currentMax, instance) => {
      const match = instance.id.match(/builder-instance-(\d+)$/);
      const value = match ? Number(match[1]) : 0;
      return Number.isFinite(value) ? Math.max(currentMax, value) : currentMax;
    }, 0);
    const maxConnectionSequence = nextConnections.reduce((currentMax, connection) => {
      const match = connection.id.match(/builder-connection-(\d+)$/);
      const value = match ? Number(match[1]) : 0;
      return Number.isFinite(value) ? Math.max(currentMax, value) : currentMax;
    }, 0);
    const nextShapes = cloneShapes(normalized.shapes);

    nextIdRef.current = Math.max(nextIdRef.current, maxInstanceSequence, maxConnectionSequence) + 1;
    setSelectedWireTypeId(
      normalized.selectedWireTypeId && wireTypes.some((item) => item.id === normalized.selectedWireTypeId)
        ? normalized.selectedWireTypeId
        : wireTypes[0]?.id ?? ""
    );
    applySnapshot({
      instances: nextInstances,
      connections: nextConnections,
      shapes: nextShapes,
    });
  }

  const applySavedSetupDocumentRef = React.useRef(applySavedSetupDocument);
  applySavedSetupDocumentRef.current = applySavedSetupDocument;

  const createPublishThumbnailDataUrl = React.useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return null;
    }

    const hiddenNodes = Array.from(stage.find(".builder-export-hidden"));
    const contentNodes = Array.from(stage.find(".builder-export-content"));
    const previousVisibility = hiddenNodes.map((node) => node.visible());
    const previousStagePosition = { x: stage.x(), y: stage.y() };
    const previousStageScale = { x: stage.scaleX(), y: stage.scaleY() };

    hiddenNodes.forEach((node) => node.visible(false));
    stage.position({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });
    stage.batchDraw();

    try {
      const exportBounds = getBuilderExportBounds(contentNodes);

      if (!exportBounds) {
        return null;
      }

      return stage.toDataURL({
        x: exportBounds.x,
        y: exportBounds.y,
        width: exportBounds.width,
        height: exportBounds.height,
        pixelRatio: 2,
        mimeType: "image/png",
      });
    } finally {
      stage.position(previousStagePosition);
      stage.scale(previousStageScale);
      hiddenNodes.forEach((node, index) => node.visible(previousVisibility[index] ?? true));
      stage.batchDraw();
    }
  }, []);

  const undoBuilder = React.useCallback(() => {
    setPastSnapshots((current) => {
      const previous = current.at(-1);

      if (!previous) {
        return current;
      }

      setFutureSnapshots((future) => [
        createBuilderSnapshot(instances, connections, shapes),
        ...future,
      ].slice(0, 80));
      applySnapshot(previous);
      return current.slice(0, -1);
    });
  }, [connections, instances, shapes]);

  const redoBuilder = React.useCallback(() => {
    setFutureSnapshots((current) => {
      const next = current[0];

      if (!next) {
        return current;
      }

      setPastSnapshots((past) => [...past, createBuilderSnapshot(instances, connections, shapes)].slice(-80));
      applySnapshot(next);
      return current.slice(1);
    });
  }, [connections, instances, shapes]);

  function getPointerInWorld() {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return null;
    }

    return {
      x: (pointer.x - canvasOffset.x) / canvasScale,
      y: (pointer.y - canvasOffset.y) / canvasScale,
    };
  }

  function handleConnectionPointDragStart(
    instanceId: string,
    pointKey: string,
    pointer: { x: number; y: number }
  ) {
    if (selectedPoint) {
      return;
    }

    const attachedConnections = connections.filter((connection) => {
      const isFromPoint =
        connection.fromInstanceId === instanceId && connection.fromPointKey === pointKey;
      const isToPoint =
        connection.toInstanceId === instanceId && connection.toPointKey === pointKey;

      return isFromPoint || isToPoint;
    });

    if (attachedConnections.length === 0) {
      return;
    }

    const preferredConnection =
      attachedConnections.find((connection) => connection.id === selectedConnectionId) ??
      attachedConnections.at(-1);

    if (!preferredConnection) {
      return;
    }

    const endpoint: DragConnectionPointState["endpoint"] =
      preferredConnection.fromInstanceId === instanceId &&
      preferredConnection.fromPointKey === pointKey
        ? "from"
        : "to";

    const nextDragState = {
      source: { instanceId, pointKey },
      connectionId: preferredConnection.id,
      endpoint,
      startWorld: {
        x: (pointer.x - canvasOffset.x) / canvasScale,
        y: (pointer.y - canvasOffset.y) / canvasScale,
      },
      moved: false,
    };

    dragConnectionPointRef.current = nextDragState;
    setDragConnectionPoint(nextDragState);
    hoverPointTargetRef.current = null;
    setHoverPointTarget(null);
  }

  function moveConnectionsToPoint(
    source: HoverPointTarget,
    target: HoverPointTarget,
    connectionId: string,
    endpoint: "from" | "to"
  ) {
    if (
      source.instanceId === target.instanceId &&
      source.pointKey === target.pointKey
    ) {
      return;
    }

    setConnections((current) =>
      current.map((connection) => {
        if (connection.id !== connectionId) {
          return connection;
        }

        let nextConnection = connection;

        if (
          endpoint === "from" &&
          connection.fromInstanceId === source.instanceId &&
          connection.fromPointKey === source.pointKey
        ) {
          nextConnection = {
            ...nextConnection,
            fromInstanceId: target.instanceId,
            fromPointKey: target.pointKey,
          };
        }

        if (
          endpoint === "to" &&
          connection.toInstanceId === source.instanceId &&
          connection.toPointKey === source.pointKey
        ) {
          nextConnection = {
            ...nextConnection,
            toInstanceId: target.instanceId,
            toPointKey: target.pointKey,
          };
        }

        return normalizeConnectionForInstances(nextConnection, instances);
      })
    );
    setCanvasMessage("Wiring endpoint moved to a new connection point.");
  }

  function getSelectionRect(box: SelectionBox) {
    if (!box) {
      return null;
    }

    return {
      x: Math.min(box.start.x, box.current.x),
      y: Math.min(box.start.y, box.current.y),
      width: Math.abs(box.current.x - box.start.x),
      height: Math.abs(box.current.y - box.start.y),
    };
  }

  function selectInstance(instanceId: string, additive = false) {
    if (!additive) {
      setSelectedInstanceId(instanceId);
      setSelectedInstanceIds([instanceId]);
      setSelectedConnectionId(null);
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
      return;
    }

    setSelectedConnectionId(null);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    setSelectedInstanceIds((current) => {
      const exists = current.includes(instanceId);
      const nextIds = exists
        ? current.filter((id) => id !== instanceId)
        : [...current, instanceId];

      setSelectedInstanceId((currentId) => {
        if (!exists) {
          return currentId ?? instanceId;
        }

        if (currentId && nextIds.includes(currentId)) {
          return currentId;
        }

        return nextIds[0] ?? null;
      });

      return nextIds;
    });
  }

  function selectShape(shapeId: string, additive = false) {
    if (!additive) {
      setSelectedShapeId(shapeId);
      setSelectedShapeIds([shapeId]);
      setSelectedInstanceId(null);
      setSelectedInstanceIds([]);
      setSelectedConnectionId(null);
      return;
    }

    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setSelectedShapeIds((current) => {
      const exists = current.includes(shapeId);
      const nextIds = exists ? current.filter((id) => id !== shapeId) : [...current, shapeId];

      setSelectedShapeId((currentId) => {
        if (!exists) {
          return currentId ?? shapeId;
        }

        if (currentId && nextIds.includes(currentId)) {
          return currentId;
        }

        return nextIds[0] ?? null;
      });

      return nextIds;
    });
  }

  function beginDraftShape(tool: Exclude<BuilderTool, "select">) {
    const pointer = getPointerInWorld();

    if (!pointer) {
      return;
    }

    setDraftShape({
      tool,
      start: pointer,
      current: pointer,
      constrainProportions: false,
    });
  }

  function updateDraftShape(ctrlKey = false) {
    const pointer = getPointerInWorld();

    if (!pointer || !draftShape) {
      return;
    }

    setDraftShape({
      ...draftShape,
      current:
        (draftShape.tool === "rectangle" || draftShape.tool === "ellipse") && ctrlKey
          ? getConstrainedPoint(draftShape.start, pointer)
          : pointer,
      constrainProportions:
        (draftShape.tool === "rectangle" || draftShape.tool === "ellipse") && ctrlKey,
    });
  }

  function commitDraftShape() {
    if (!draftShape) {
      return;
    }

    const shape = createBuilderShapeFromDraft(draftShape);
    const dimensions = getObjectDimensions(shape);

    if (dimensions.width < MIN_SELECTION_BOX_SIZE && dimensions.height < MIN_SELECTION_BOX_SIZE) {
      setDraftShape(null);
      return;
    }

    setShapes((current) => [...current, shape]);
    setSelectedShapeId(shape.id);
    setSelectedShapeIds([shape.id]);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setActiveTool("select");
    setDraftShape(null);
    setCanvasMessage(`${shape.name} added to the builder canvas.`);
  }

  function addInstance(assetId: string, dropX?: number, dropY?: number) {
    const asset = getAsset(assetId);

    if (!asset) {
      return;
    }

    const id = `builder-instance-${nextIdRef.current}`;
    nextIdRef.current += 1;
    const x = dropX ?? 80 + instances.length * 24;
    const y = dropY ?? 80 + instances.length * 24;
    const initialScale = getInitialScale(asset.width, asset.height);

    setInstances((current) => [
      ...current,
      {
        id,
        assetId: asset.id,
        componentAssetId: asset.componentAssetId,
        name: asset.name,
        componentType: asset.componentType,
        x: snapToGrid(Math.max(24, x - asset.width / 2)),
        y: snapToGrid(Math.max(24, y - asset.height / 2)),
        width: asset.width,
        height: asset.height,
        renderWidth: asset.width,
        renderHeight: asset.height,
        scale: initialScale,
        rotation: 0,
        showLabel: false,
        labelOffsetX: 0,
        labelOffsetY: 0,
      },
    ]);
    setSelectedInstanceId(id);
    setSelectedInstanceIds([id]);
    setCanvasMessage(`${asset.name} added to the canvas and ready to drag.`);
  }

  const copySelectedInstances = React.useCallback(() => {
    if (selectedInstances.length === 0) {
      return;
    }

    clipboardRef.current = cloneInstances(selectedInstances);
    setCanvasMessage(`${selectedInstances.length} component(s) copied to builder clipboard.`);
  }, [selectedInstances]);

  const pasteCopiedInstances = React.useCallback(() => {
    if (clipboardRef.current.length === 0) {
      return;
    }

    const nextInstances = clipboardRef.current.map((instance, index) => {
      const nextId = `builder-instance-${nextIdRef.current}`;
      nextIdRef.current += 1;

      return {
        ...instance,
        id: nextId,
        name: `${instance.name} Copy`,
        x: snapToGrid(instance.x + WIRE_GRID_SIZE * 2 + index * 2),
        y: snapToGrid(instance.y + WIRE_GRID_SIZE * 2 + index * 2),
      };
    });

    clipboardRef.current = cloneInstances(nextInstances);
    setInstances((current) => [...current, ...nextInstances]);
    setSelectedInstanceId(nextInstances[0]?.id ?? null);
    setSelectedInstanceIds(nextInstances.map((instance) => instance.id));
    setSelectedConnectionId(null);
    setCanvasMessage(`${nextInstances.length} component(s) pasted to canvas.`);
  }, []);

  function handlePointSelect(instanceId: string, pointKey: string) {
    if (suppressPointSelectionRef.current) {
      suppressPointSelectionRef.current = false;
      return;
    }

    if (!selectedWireTypeId) {
      setCanvasMessage("Please select a wire type before creating a connection.");
      return;
    }

    if (
      selectedPoint?.instanceId === instanceId &&
      selectedPoint.pointKey === pointKey
    ) {
      setSelectedPoint(null);
      setHoverPointTarget(null);
      setCanvasMessage("Connection point deselected.");
      return;
    }

    if (!selectedPoint) {
      setSelectedPoint({ instanceId, pointKey });
      setHoverPointTarget(null);
      setCanvasMessage("First point selected. Click the target point to connect wiring.");
      return;
    }

    if (selectedPoint.instanceId === instanceId && selectedPoint.pointKey === pointKey) {
      setSelectedPoint(null);
      setHoverPointTarget(null);
      return;
    }

    const duplicate = connections.some((connection) => {
      const direct =
        connection.fromInstanceId === selectedPoint.instanceId &&
        connection.fromPointKey === selectedPoint.pointKey &&
        connection.toInstanceId === instanceId &&
        connection.toPointKey === pointKey;
      const reverse =
        connection.fromInstanceId === instanceId &&
        connection.fromPointKey === pointKey &&
        connection.toInstanceId === selectedPoint.instanceId &&
        connection.toPointKey === selectedPoint.pointKey;

      return direct || reverse;
    });

    if (duplicate) {
      setSelectedPoint(null);
      setHoverPointTarget(null);
      setCanvasMessage("That connection already exists on the canvas.");
      return;
    }

    const connectionId = `builder-connection-${nextIdRef.current}`;
    nextIdRef.current += 1;
    const from = getPoint(selectedPoint.instanceId, selectedPoint.pointKey);
    const to = getPoint(instanceId, pointKey);

    if (!from || !to) {
      setSelectedPoint(null);
      setHoverPointTarget(null);
      setCanvasMessage("Failed to create connection because reference points were not found.");
      return;
    }

    setConnections((current) => [
      ...current,
      {
        id: connectionId,
        fromInstanceId: selectedPoint.instanceId,
        fromPointKey: selectedPoint.pointKey,
        toInstanceId: instanceId,
        toPointKey: pointKey,
        wireTypeId: selectedWireTypeId,
        controlPoints: normalizeConnectionControlPoints(
          createDefaultControlPoints(from, to),
          from,
          to
        ),
        tension: 0,
      },
    ]);
    setSelectedPoint(null);
    setHoverPointTarget(null);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(connectionId);
    setCanvasMessage("Wiring successfully created from the selected connection points.");
  }

  function straightenSelectedConnection() {
    if (!selectedConnectionId) {
      setCanvasMessage("Please select a wire to straighten it.");
      return;
    }

    setConnections((current) =>
      current.map((connection) => {
        if (connection.id !== selectedConnectionId) {
          return connection;
        }

        const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
        const to = getPoint(connection.toInstanceId, connection.toPointKey);

        if (!from || !to) {
          return connection;
        }

        return {
          ...connection,
          controlPoints: normalizeConnectionControlPoints(
            straightenConnectionControlPoints(from, to),
            from,
            to
          ),
        };
      })
    );
    setCanvasMessage("Selected wire straightened.");
  }

  function updateCanvasScale(nextScale: number) {
    setCanvasScale(Math.min(MAX_CANVAS_SCALE, Math.max(MIN_CANVAS_SCALE, nextScale)));
  }

  function zoomCanvasAroundPoint(
    nextScale: number,
    anchor?: { x: number; y: number } | null
  ) {
    const clampedScale = Math.min(MAX_CANVAS_SCALE, Math.max(MIN_CANVAS_SCALE, nextScale));

    if (!anchor || Math.abs(clampedScale - canvasScale) < 0.0001) {
      setCanvasScale(clampedScale);
      return;
    }

    const worldX = (anchor.x - canvasOffset.x) / canvasScale;
    const worldY = (anchor.y - canvasOffset.y) / canvasScale;

    setCanvasScale(clampedScale);
    setCanvasOffset({
      x: anchor.x - worldX * clampedScale,
      y: anchor.y - worldY * clampedScale,
    });
  }

  function setSelectedInstanceLabelVisibility(checked: boolean) {
    if (selectedInstanceIds.length === 0) {
      return;
    }

    setInstances((current) =>
      current.map((instance) =>
        selectedInstanceIds.includes(instance.id)
          ? { ...instance, showLabel: checked }
          : instance
      )
    );
    setCanvasMessage(checked ? "Component labels shown." : "Component labels hidden.");
  }

  function resetCanvasView() {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasMessage("Canvas zoom reset to 100%.");
  }

  function removeSelectedInstances() {
    if (selectedInstanceIds.length === 0) {
      return;
    }

    setInstances((current) =>
      current.filter((instance) => !selectedInstanceIds.includes(instance.id))
    );
    setConnections((current) =>
      current.filter(
        (connection) =>
          !selectedInstanceIds.includes(connection.fromInstanceId) &&
          !selectedInstanceIds.includes(connection.toInstanceId)
      )
    );
    setSelectedPoint((current) =>
      current && selectedInstanceIds.includes(current.instanceId) ? null : current
    );
    setHoverPointTarget((current) =>
      current && selectedInstanceIds.includes(current.instanceId) ? null : current
    );
    setCanvasMessage("Selected component(s) removed from canvas.");
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
  }

  function removeSelectedShapes() {
    if (selectedShapeIds.length === 0) {
      return;
    }

    setShapes((current) => current.filter((shape) => !selectedShapeIds.includes(shape.id)));
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    setCanvasMessage("Selected shape(s) removed from canvas.");
  }

  function clearCanvas() {
    setInstances([]);
    setConnections([]);
    setShapes([]);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    setSelectedPoint(null);
    setHoverPointTarget(null);
    setDragConnectionPoint(null);
    setDraftShape(null);
    setCanvasMessage("Canvas cleared.");
  }

  const loadSavedSetupIntoCanvas = React.useCallback(
    (setup: BuilderSavedSetupRow) => {
      applySavedSetupDocumentRef.current(
        normalizeBuilderSavedSetupDocument(setup.documentJson)
      );
      setActiveSavedSetupId(setup.id);
      setActiveSavedSetupName(setup.name);
      setSavedSetupStatus(setup.status);
      setActivePublishedTemplateId(setup.publishedTemplateId);
      setSavedSetupDescription(setup.description ?? "");
      setCanvasMessage(`Setup "${setup.name}" loaded.`);
    },
    []
  );

  const loadSavedSetups = React.useCallback(async () => {
    if (!canPersistSavedSetups) {
      return [] as BuilderSavedSetupRow[];
    }

    setIsLoadingSavedSetups(true);

    try {
      const response = await fetch("/api/builder-saved-setups");
      const payload = (await response.json()) as
        | BuilderSavedSetupRow[]
        | { error?: string };

      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(
          !Array.isArray(payload) && payload.error
            ? payload.error
            : "Failed to load saved setups."
        );
      }

      setSavedSetups(payload);
      return payload;
    } catch (error) {
      setCanvasMessage(error instanceof Error ? error.message : "Failed to load saved setups.");
      return [] as BuilderSavedSetupRow[];
    } finally {
      setIsLoadingSavedSetups(false);
    }
  }, [canPersistSavedSetups]);

  React.useEffect(() => {
    if (!initialSavedSetupId || !canPersistSavedSetups) {
      return;
    }

    if (initialSavedSetupLoadRef.current === initialSavedSetupId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const availableSetups =
        savedSetups.length > 0 ? savedSetups : await loadSavedSetups();

      if (cancelled) {
        return;
      }

      const targetSetup = availableSetups.find((setup) => setup.id === initialSavedSetupId);

      if (!targetSetup) {
        setCanvasMessage(`Saved setup "${initialSavedSetupId}" not found.`);
        initialSavedSetupLoadRef.current = initialSavedSetupId;
        return;
      }

      loadSavedSetupIntoCanvas(targetSetup);
      initialSavedSetupLoadRef.current = initialSavedSetupId;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canPersistSavedSetups,
    initialSavedSetupId,
    loadSavedSetupIntoCanvas,
    loadSavedSetups,
    savedSetups,
  ]);

  const saveSetupDraft = React.useCallback(
    async (options?: {
      forceCreateNew?: boolean;
      name?: string;
      description?: string;
      closeDialog?: boolean;
    }) => {
      if (!canPersistSavedSetups) {
        setCanvasMessage("Sign in to save builder setups.");
        return;
      }

      const name = (options?.name ?? setupNameInput).trim();
      const description = (options?.description ?? setupDescriptionInput).trim();
      const targetSetupId = options?.forceCreateNew ? null : activeSavedSetupId;

      if (!name) {
        setCanvasMessage("Setup name is required.");
        return;
      }

      setIsSavingSetup(true);

      try {
        const thumbnailDataUrl = createPublishThumbnailDataUrl();

        const response = await fetch(
          targetSetupId
            ? `/api/builder-saved-setups/${targetSetupId}`
            : "/api/builder-saved-setups",
          {
            method: targetSetupId ? "PUT" : "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              name,
              slug: null,
              description: description || null,
              status: "DRAFT" satisfies BuilderSavedSetupStatus,
              document: persistedDocument,
              thumbnailDataUrl,
            }),
          }
        );
        const payload = (await response.json()) as
          | BuilderSavedSetupRow
          | { error?: string };

        if (!response.ok || Array.isArray(payload) || !("id" in payload)) {
          throw new Error(
            !Array.isArray(payload) && "error" in payload && payload.error
              ? payload.error
              : "Failed to save setup."
          );
        }

        setActiveSavedSetupId(payload.id);
        setActiveSavedSetupName(payload.name);
        setSavedSetupStatus(payload.status);
        setActivePublishedTemplateId(payload.publishedTemplateId);
        setSavedSetupDescription(payload.description ?? "");
        persistSavedSetupListEntry(payload);
        setCanvasMessage(`Draft "${payload.name}" saved.`);

        if (options?.closeDialog !== false) {
          setSaveDialogOpen(false);
        }
      } catch (error) {
        setCanvasMessage(error instanceof Error ? error.message : "Failed to save setup.");
      } finally {
        setIsSavingSetup(false);
      }
    },
    [
      canPersistSavedSetups,
      activeSavedSetupId,
      persistSavedSetupListEntry,
      persistedDocument,
      setupDescriptionInput,
      setupNameInput,
    ]
  );

  const deleteSavedSetup = React.useCallback(
    async (setupId: string) => {
      setSavedSetupActionId(setupId);

      try {
        const response = await fetch(`/api/builder-saved-setups/${setupId}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as { error?: string; success?: boolean };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to delete saved setup.");
        }

        setSavedSetups((current) => current.filter((item) => item.id !== setupId));

        if (activeSavedSetupId === setupId) {
          setActiveSavedSetupId(null);
          setActiveSavedSetupName(null);
          setSavedSetupStatus(null);
          setActivePublishedTemplateId(null);
          setSavedSetupDescription("");
        }

        setCanvasMessage("Saved setup deleted.");
      } catch (error) {
        setCanvasMessage(error instanceof Error ? error.message : "Failed to delete saved setup.");
      } finally {
        setSavedSetupActionId(null);
      }
    },
    [activeSavedSetupId]
  );

  const openSaveDraftDialog = React.useCallback(() => {
    if (!canPersistSavedSetups) {
      setCanvasMessage("Sign in to save builder setups.");
      return;
    }

    setSaveDialogMode("save");
    setSetupNameInput(activeSavedSetupName ?? "Untitled Builder Setup");
    setSetupDescriptionInput(savedSetupDescription);
    setSaveDialogOpen(true);
  }, [activeSavedSetupName, canPersistSavedSetups, savedSetupDescription]);

  const openSaveAsDialog = React.useCallback(() => {
    if (!canPersistSavedSetups) {
      setCanvasMessage("Sign in to save builder setups.");
      return;
    }

    setSaveDialogMode("saveAs");
    setSetupNameInput(
      activeSavedSetupName ? `${activeSavedSetupName} Copy` : "Untitled Builder Setup"
    );
    setSetupDescriptionInput(savedSetupDescription);
    setSaveDialogOpen(true);
  }, [activeSavedSetupName, canPersistSavedSetups, savedSetupDescription]);

  const saveCurrentSetup = React.useCallback(() => {
    if (!canPersistSavedSetups) {
      setCanvasMessage("Sign in to save builder setups.");
      return;
    }

    if (!activeSavedSetupId || !activeSavedSetupName) {
      openSaveDraftDialog();
      return;
    }

    void saveSetupDraft({
      name: activeSavedSetupName,
      description: savedSetupDescription,
      closeDialog: false,
    });
  }, [
    activeSavedSetupId,
    activeSavedSetupName,
    canPersistSavedSetups,
    openSaveDraftDialog,
    saveSetupDraft,
    savedSetupDescription,
  ]);

  const createNewComponent = React.useCallback(() => {
    clearCanvas();
    setActiveSavedSetupId(null);
    setActiveSavedSetupName(null);
    setSavedSetupStatus(null);
    setActivePublishedTemplateId(null);
    setSavedSetupDescription("");
    setSetupNameInput("");
    setSetupDescriptionInput("");
    setCanvasMessage("New canvas ready to use.");
  }, []);

  const exportJsonDocument = React.useCallback(() => {
    const payload = {
      kind: "custom-builder-setup",
      version: 1,
      name: activeSavedSetupName,
      description: savedSetupDescription || null,
      document: createBuilderSavedSetupDocument(
        latestInstancesRef.current,
        latestConnectionsRef.current,
        latestShapesRef.current,
        selectedWireTypeId
      ),
    };

    downloadJsonFile(
      `${slugifyJsonFilename(activeSavedSetupName ?? "builder-setup")}.json`,
      payload
    );
    setCanvasMessage("JSON exported.");
  }, [activeSavedSetupName, savedSetupDescription, selectedWireTypeId]);

  async function importJsonDocument(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        name?: unknown;
        description?: unknown;
        document?: unknown;
      };
      const documentSource =
        parsed && typeof parsed === "object" && "document" in parsed
          ? parsed.document
          : parsed;
      const normalized = normalizeBuilderSavedSetupDocument(documentSource);
      const importedName =
        typeof parsed?.name === "string" && parsed.name.trim()
          ? parsed.name
          : getFilenameBase(file.name);
      const importedDescription =
        typeof parsed?.description === "string" ? parsed.description : "";

      applySavedSetupDocument(normalized);
      setActiveSavedSetupId(null);
      setActiveSavedSetupName(importedName);
      setSavedSetupStatus(null);
      setActivePublishedTemplateId(null);
      setSavedSetupDescription(importedDescription);
      setSetupNameInput(importedName);
      setSetupDescriptionInput(importedDescription);
      setCanvasMessage(`Imported JSON "${file.name}".`);
    } catch (error) {
      setCanvasMessage(error instanceof Error ? error.message : "Failed to import JSON.");
    }
  }

  const openPublishDialog = React.useCallback(() => {
    if (!canPersistSavedSetups) {
      setCanvasMessage("Sign in to publish builder setups.");
      return;
    }

    const baseName = activeSavedSetupName ?? "Builder Setup";

    setPublishForm({
      name: baseName,
      slug: slugifyBuilderSetupName(baseName),
      description: savedSetupDescription,
      pickupConfigurationId: derivedPublishValues.pickupConfigurationId,
      switchTypeId: derivedPublishValues.switchTypeId,
      volumeCount: derivedPublishValues.volumeCount,
      toneCount: derivedPublishValues.toneCount,
      difficultyLevel: "",
      sourceType: "Custom Builder",
      sourceUrl: "",
      isVerified: false,
      tags: "",
    });
    setPublishErrorMessage(null);
    setPublishDialogOpen(true);
  }, [
    activeSavedSetupName,
    canPersistSavedSetups,
    derivedPublishValues,
    savedSetupDescription,
  ]);

  const openSavedSetupBrowser = React.useCallback(() => {
    setSavedSetupBrowserOpen(true);

    if (canPersistSavedSetups) {
      void loadSavedSetups();
    }
  }, [canPersistSavedSetups, loadSavedSetups]);

  const publishToWiringTemplate = React.useCallback(async () => {
    if (!canPersistSavedSetups) {
      setCanvasMessage("Sign in to publish builder setups.");
      return;
    }

    if (instances.length === 0) {
      setPublishErrorMessage("Add at least one component before publishing.");
      setCanvasMessage("Add at least one component before publishing.");
      return;
    }

    if (!publishForm.name.trim() || !publishForm.slug.trim()) {
      setPublishErrorMessage("Name and slug are required to publish.");
      setCanvasMessage("Name and slug are required to publish.");
      return;
    }

    const thumbnailDataUrl = createPublishThumbnailDataUrl();

    if (!thumbnailDataUrl) {
      setPublishErrorMessage("Unable to generate publish thumbnail from the current canvas.");
      setCanvasMessage("Unable to generate publish thumbnail from the current canvas.");
      return;
    }

    setIsSavingSetup(true);
    setPublishErrorMessage(null);

    try {
      // Save draft first so thumbnail and document are up to date
      if (activeSavedSetupId && activeSavedSetupName) {
        await fetch(`/api/builder-saved-setups/${activeSavedSetupId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: activeSavedSetupName,
            description: savedSetupDescription || null,
            status: "DRAFT",
            document: persistedDocument,
            thumbnailDataUrl,
          }),
        });
      }

      const response = await fetch("/api/custom-builder-publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          savedSetupId: activeSavedSetupId,
          thumbnailDataUrl,
          name: publishForm.name.trim(),
          slug: publishForm.slug.trim(),
          description: publishForm.description.trim() || null,
          pickupConfigurationId: publishForm.pickupConfigurationId,
          switchTypeId: publishForm.switchTypeId,
          volumeCount: publishForm.volumeCount,
          toneCount: publishForm.toneCount,
          difficultyLevel: publishForm.difficultyLevel.trim() || null,
          sourceType: publishForm.sourceType.trim() || null,
          sourceUrl: publishForm.sourceUrl.trim() || null,
          isVerified: publishForm.isVerified,
          tags: publishForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
          document: persistedDocument,
        }),
      });
      const rawPayload = await response.text();
      const payload = rawPayload
        ? ((JSON.parse(rawPayload) as {
            error?: string;
            template?: { id: string; name: string; slug: string | null };
            savedSetup?: BuilderSavedSetupRow | null;
          }))
        : {};

      if (!response.ok) {
        throw new Error(
          ("error" in payload && payload.error) ||
            rawPayload ||
            `Failed to publish builder setup. HTTP ${response.status}`
        );
      }

      if (payload.savedSetup) {
        setActiveSavedSetupId(payload.savedSetup.id);
        setActiveSavedSetupName(payload.savedSetup.name);
        setSavedSetupStatus(payload.savedSetup.status);
        setActivePublishedTemplateId(payload.savedSetup.publishedTemplateId);
        setSavedSetupDescription(payload.savedSetup.description ?? "");
        persistSavedSetupListEntry(payload.savedSetup);
      } else {
        setSavedSetupStatus("DRAFT");
      }

      setCanvasMessage(
        `Published wiring template "${payload.template?.name ?? publishForm.name.trim()}".`
      );
      setPublishErrorMessage(null);
      setPublishDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish builder setup.";
      setPublishErrorMessage(message);
      setCanvasMessage(message);
    } finally {
      setIsSavingSetup(false);
    }
  }, [
    activeSavedSetupId,
    canPersistSavedSetups,
    instances.length,
    persistSavedSetupListEntry,
    persistedDocument,
    publishForm,
    createPublishThumbnailDataUrl,
  ]);

  function removeSelectedConnection() {
    if (!selectedConnectionId) {
      return;
    }

    setConnections((current) =>
      current.filter((connection) => connection.id !== selectedConnectionId)
    );
    setSelectedConnectionId(null);
    setCanvasMessage("Selected wire deleted.");
  }

  function updateInstance(
    instanceId: string,
    patch: Partial<
      Pick<
        BuilderInstance,
        "x" | "y" | "rotation" | "scale" | "showLabel" | "labelOffsetX" | "labelOffsetY"
      >
    >
  ) {
    setInstances((current) => {
      const nextInstances = current.map((instance) =>
        instance.id === instanceId ? { ...instance, ...patch } : instance
      );

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          connection.fromInstanceId === instanceId || connection.toInstanceId === instanceId
            ? normalizeConnectionForInstances(connection, nextInstances)
            : connection
        )
      );

      return nextInstances;
    });
  }

  function updateShape(shapeId: string, patch: Partial<BuilderSetupShape>) {
    setShapes((current) =>
      current.map((shape) => (shape.id === shapeId ? ({ ...shape, ...patch } as BuilderSetupShape) : shape))
    );
  }

  function updateShapes(
    shapeIds: string[],
    updater: (shape: BuilderSetupShape) => BuilderSetupShape
  ) {
    if (shapeIds.length === 0) {
      return;
    }

    setShapes((current) =>
      current.map((shape) => (shapeIds.includes(shape.id) ? updater(shape) : shape))
    );
  }

  function commitTransformedShapes(shapeIds: string[]) {
    if (shapeIds.length === 0) {
      return;
    }

    setShapes((current) =>
      current.map((shape) => {
        if (!shapeIds.includes(shape.id)) {
          return shape;
        }

        const node = shapeNodeRefs.current.get(shape.id);

        if (!node) {
          return shape;
        }

        const nextX = snapToGrid(node.x());
        const nextY = snapToGrid(node.y());
        const nextRotation = node.rotation();
        const nextScaleX = node.scaleX();
        const nextScaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        if (shape.type === "rectangle" || shape.type === "ellipse") {
          return {
            ...shape,
            x: nextX,
            y: nextY,
            rotation: nextRotation,
            width: Math.max(10, shape.width * nextScaleX),
            height: Math.max(10, shape.height * nextScaleY),
            scaleX: 1,
            scaleY: 1,
          };
        }

        if (shape.type === "text") {
          return withAutoSizedTextDimensions({
            ...shape,
            x: nextX,
            y: nextY,
            rotation: nextRotation,
            fontSize: Math.max(8, shape.fontSize * Math.max(nextScaleX, nextScaleY)),
            scaleX: 1,
            scaleY: 1,
          });
        }

        if (shape.type === "image") {
          return {
            ...shape,
            x: nextX,
            y: nextY,
            rotation: nextRotation,
            width: Math.max(10, shape.width * nextScaleX),
            height: Math.max(10, shape.height * nextScaleY),
            scaleX: 1,
            scaleY: 1,
          };
        }

        return {
          ...shape,
          x: nextX,
          y: nextY,
          rotation: nextRotation,
          points: shape.points.map((point, index) =>
            index % 2 === 0 ? point * nextScaleX : point * nextScaleY
          ),
          scaleX: 1,
          scaleY: 1,
        };
      })
    );
  }

  function updateInstances(
    instanceIds: string[],
    updater: (instance: BuilderInstance) => BuilderInstance
  ) {
    if (instanceIds.length === 0) {
      return;
    }

    setInstances((current) => {
      const nextInstances = current.map((instance) =>
        instanceIds.includes(instance.id) ? updater(instance) : instance
      );

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          instanceIds.includes(connection.fromInstanceId) ||
          instanceIds.includes(connection.toInstanceId)
            ? normalizeConnectionForInstances(connection, nextInstances)
            : connection
        )
      );

      return nextInstances;
    });
  }

  function commitTransformedInstances(instanceIds: string[]) {
    if (instanceIds.length === 0) {
      return;
    }

    setInstances((current) => {
      const nextInstances = current.map((instance) => {
        if (!instanceIds.includes(instance.id)) {
          return instance;
        }

        const node = nodeRefs.current.get(instance.id);

        if (!node) {
          return instance;
        }

        return {
          ...instance,
          x: snapToGrid(node.x()),
          y: snapToGrid(node.y()),
          scale: Math.max(0.2, node.scaleX()),
          rotation: node.rotation(),
        };
      });

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          instanceIds.includes(connection.fromInstanceId) ||
          instanceIds.includes(connection.toInstanceId)
            ? normalizeConnectionForInstances(connection, nextInstances)
            : connection
        )
      );

      return nextInstances;
    });
  }

  function updateConnectionWireType(connectionId: string, wireTypeId: string) {
    setConnections((current) =>
      current.map((connection) =>
        connection.id === connectionId ? { ...connection, wireTypeId } : connection
      )
    );
  }

  function toggleInstanceLabel(instanceId: string) {
    const instance = instances.find((item) => item.id === instanceId);

    if (!instance) {
      return;
    }

    updateInstance(instanceId, { showLabel: !instance.showLabel });
  }

  function beginInlineTextEdit(shapeId: string) {
    const target = shapes.find((shape) => shape.id === shapeId);
    const node = shapeNodeRefs.current.get(shapeId);
    const stage = stageRef.current;

    if (!target || target.type !== "text" || !node || !stage) {
      return;
    }

    const bounds = node.getClientRect({
      skipShadow: false,
      skipStroke: false,
    });
    const stageScaleX = stage.scaleX();
    const stageScaleY = stage.scaleY();
    const stageOffsetX = stage.x();
    const stageOffsetY = stage.y();

    setInlineTextEditor({
      shapeId,
      value: target.text,
      style: {
        left: bounds.x * stageScaleX + stageOffsetX,
        top: bounds.y * stageScaleY + stageOffsetY,
        width: Math.max(bounds.width * stageScaleX, 120),
        height: Math.max(bounds.height * stageScaleY, target.fontSize * stageScaleY + 20),
        fontSize: `${target.fontSize * stageScaleY}px`,
        fontFamily: target.fontFamily,
        fontStyle: target.fontStyle,
        color: target.fill,
        textAlign: target.textAlign,
        lineHeight: "1.2",
        transform: `rotate(${target.rotation}deg)`,
        transformOrigin: "top left",
      },
    });
    setSelectedShapeId(shapeId);
    setSelectedShapeIds([shapeId]);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
  }

  function commitInlineTextEdit() {
    if (!inlineTextEditor) {
      return;
    }

    const target = shapes.find((shape) => shape.id === inlineTextEditor.shapeId);

    if (target?.type === "text") {
      updateShape(
        target.id,
        withAutoSizedTextDimensions({
          ...target,
          text: inlineTextEditor.value,
        })
      );
    }

    setInlineTextEditor(null);
  }

  function cancelInlineTextEdit() {
    setInlineTextEditor(null);
  }

  function alignSelectedInstance(
    mode: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) {
    if (selectedInstanceIds.length === 0) {
      return;
    }

    const activeInstances = instances.filter((item) => selectedInstanceIds.includes(item.id));

    if (activeInstances.length === 0) {
      return;
    }

    if (activeInstances.length === 1) {
      const instance = activeInstances[0];
      const width = instance.renderWidth * instance.scale;
      const height = instance.renderHeight * instance.scale;

      updateInstance(instance.id, {
        x:
          mode === "left"
            ? snapToGrid(24)
            : mode === "center"
              ? snapToGrid((worldViewportWidth - width) / 2)
              : mode === "right"
                ? snapToGrid(Math.max(24, worldViewportWidth - width - 24))
                : instance.x,
        y:
          mode === "top"
            ? snapToGrid(24)
            : mode === "middle"
              ? snapToGrid((worldViewportHeight - height) / 2)
              : mode === "bottom"
                ? snapToGrid(Math.max(24, worldViewportHeight - height - 24))
                : instance.y,
      });
      setCanvasMessage("Components aligned to the selected alignment.");
      return;
    }

    const bounds = activeInstances.map((instance) => ({
      id: instance.id,
      x: instance.x,
      y: instance.y,
      width: instance.renderWidth * instance.scale,
      height: instance.renderHeight * instance.scale,
    }));
    const aggregate = bounds.reduce(
      (current, item) => {
        const minX = Math.min(current.x, item.x);
        const minY = Math.min(current.y, item.y);
        const maxX = Math.max(current.x + current.width, item.x + item.width);
        const maxY = Math.max(current.y + current.height, item.y + item.height);

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      },
      {
        x: bounds[0].x,
        y: bounds[0].y,
        width: bounds[0].width,
        height: bounds[0].height,
      }
    );

    updateInstances(selectedInstanceIds, (instance) => {
      const width = instance.renderWidth * instance.scale;
      const height = instance.renderHeight * instance.scale;

      return {
        ...instance,
        x:
          mode === "left"
            ? snapToGrid(aggregate.x)
            : mode === "center"
              ? snapToGrid(aggregate.x + aggregate.width / 2 - width / 2)
              : mode === "right"
                ? snapToGrid(aggregate.x + aggregate.width - width)
                : instance.x,
        y:
          mode === "top"
            ? snapToGrid(aggregate.y)
            : mode === "middle"
              ? snapToGrid(aggregate.y + aggregate.height / 2 - height / 2)
              : mode === "bottom"
                ? snapToGrid(aggregate.y + aggregate.height - height)
                : instance.y,
      };
    });
    setCanvasMessage("Components aligned to the selected alignment.");
  }

  function moveBuilderLayer(
    dragged: { id: string; kind: BuilderLayerEntry["kind"] },
    target: { id: string; kind: BuilderLayerEntry["kind"] }
  ) {
    if (dragged.id === target.id || dragged.kind !== target.kind) {
      return;
    }

    if (dragged.kind === "connection") {
      setConnections((current) => moveItemBefore(current, dragged.id, target.id));
      setCanvasMessage("Wiring layer order updated.");
      return;
    }

    if (dragged.kind === "shape") {
      setShapes((current) => moveItemBefore(current, dragged.id, target.id));
      setCanvasMessage("Shape layer order updated.");
      return;
    }

    setInstances((current) => moveItemBefore(current, dragged.id, target.id));
    setCanvasMessage("Component layer order updated.");
  }

  const handleShortcutDeleteSelection = React.useEffectEvent(() => {
    if (selectedConnectionId) {
      removeSelectedConnection();
      return;
    }

    if (selectedShapeIds.length > 0) {
      removeSelectedShapes();
      return;
    }

    if (selectedInstanceIds.length > 0) {
      removeSelectedInstances();
    }
  });

  const handleShortcutMoveSelection = React.useEffectEvent((deltaX: number, deltaY: number) => {
    if (selectedShapeIds.length > 0) {
      updateShapes(selectedShapeIds, (shape) => ({
        ...shape,
        x: snapToGrid(shape.x + deltaX),
        y: snapToGrid(shape.y + deltaY),
      }));
      return;
    }

    if (selectedInstanceIds.length === 0) {
      return;
    }

    updateInstances(selectedInstanceIds, (instance) => ({
      ...instance,
      x: snapToGrid(instance.x + deltaX),
      y: snapToGrid(instance.y + deltaY),
    }));
  });

  const handleShortcutStraightenWire = React.useEffectEvent(() => {
    if (selectedConnectionId) {
      straightenSelectedConnection();
    }
  });

  const handleShortcutToggleLabel = React.useEffectEvent(() => {
    if (selectedInstanceIds.length > 0) {
      setSelectedInstanceLabelVisibility(
        !selectedInstances.every((instance) => instance.showLabel)
      );
    }
  });

  React.useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();

      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleShortcutDeleteSelection();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedPoint(null);
        setHoverPointTarget(null);
        setSelectedInstanceId(null);
        setSelectedInstanceIds([]);
        setSelectedConnectionId(null);
        setSelectedShapeId(null);
        setSelectedShapeIds([]);
        setDraftShape(null);
        setActiveTool("select");
        setCanvasMessage("Selection cleared.");
        return;
      }

      if (selectedInstanceIds.length > 0 || selectedShapeIds.length > 0) {
        const step = event.shiftKey ? WIRE_GRID_SIZE * 2 : WIRE_GRID_SIZE;

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          handleShortcutMoveSelection(-step, 0);
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          handleShortcutMoveSelection(step, 0);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          handleShortcutMoveSelection(0, -step);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          handleShortcutMoveSelection(0, step);
          return;
        }
      }

      if (modifier && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        zoomCanvasAroundPoint(
          canvasScale + CANVAS_SCALE_STEP,
          stageRef.current?.getPointerPosition() ?? {
            x: stageSize.width / 2,
            y: stageSize.height / 2,
          }
        );
        return;
      }

      if (modifier && key === "z" && event.shiftKey) {
        event.preventDefault();
        redoBuilder();
        return;
      }

      if (modifier && key === "z") {
        event.preventDefault();
        undoBuilder();
        return;
      }

      if (modifier && key === "y") {
        event.preventDefault();
        redoBuilder();
        return;
      }

      if (modifier && key === "s") {
        event.preventDefault();
        saveCurrentSetup();
        return;
      }

      if (modifier && key === "c") {
        if (selectedInstances.length === 0) {
          return;
        }

        event.preventDefault();
        copySelectedInstances();
        return;
      }

      if (modifier && key === "v") {
        if (clipboardRef.current.length === 0) {
          return;
        }

        event.preventDefault();
        pasteCopiedInstances();
        return;
      }

      if (modifier && event.key === "-") {
        event.preventDefault();
        zoomCanvasAroundPoint(
          canvasScale - CANVAS_SCALE_STEP,
          stageRef.current?.getPointerPosition() ?? {
            x: stageSize.width / 2,
            y: stageSize.height / 2,
          }
        );
        return;
      }

      if (modifier && event.key === "0") {
        event.preventDefault();
        resetCanvasView();
        return;
      }

      if (key === "s" && selectedConnectionId) {
        event.preventDefault();
        handleShortcutStraightenWire();
        return;
      }

      if (key === "l" && selectedInstanceIds.length > 0) {
        event.preventDefault();
        handleShortcutToggleLabel();
        return;
      }

      if (key === "c" && selectedPoint) {
        event.preventDefault();
        setSelectedPoint(null);
        setHoverPointTarget(null);
        setCanvasMessage("Wiring mode cancelled.");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canvasScale,
    selectedConnectionId,
    selectedInstanceIds,
    selectedInstances,
    selectedShapeIds,
    selectedPoint,
    copySelectedInstances,
    pasteCopiedInstances,
    redoBuilder,
    saveCurrentSetup,
    undoBuilder,
    shapes,
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <input
        ref={importJsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          await importJsonDocument(file);
          event.target.value = "";
        }}
      />
      <input
        ref={importImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result);
            const img = new window.Image();
            img.onload = () => {
              const maxW = 600;
              const maxH = 400;
              const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
              const width = Math.round(img.naturalWidth * scale);
              const height = Math.round(img.naturalHeight * scale);
              const imageShape: import("@/lib/custom-builder-saved-setup-types").BuilderSetupShape = {
                id: `shape-img-${Date.now()}`,
                type: "image",
                name: file.name.replace(/\.[^/.]+$/, "") || "Reference Image",
                x: 80,
                y: 80,
                width,
                height,
                src: dataUrl,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                fill: "transparent",
                stroke: "transparent",
                strokeWidth: 0,
                visible: true,
                locked: false,
              };
              setShapes((current) => [...current, imageShape]);
              setSelectedShapeId(imageShape.id);
              setSelectedShapeIds([imageShape.id]);
              setSelectedInstanceId(null);
              setSelectedInstanceIds([]);
              setSelectedConnectionId(null);
              setCanvasMessage(`Image "${file.name}" added as a layer. Resize and position it as needed.`);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          event.target.value = "";
        }}
      />
      <div className={`grid h-[calc(100vh-140px)] min-h-0 flex-1 grid-cols-1 overflow-hidden ${showLeftPanel && showRightPanel ? "xl:grid-cols-[320px_minmax(0,1fr)_340px]" : showLeftPanel ? "xl:grid-cols-[320px_minmax(0,1fr)]" : showRightPanel ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        {showLeftPanel && (
        <div className="flex min-h-0 flex-col border-r border-border/70 bg-background/95">
          <div className="shrink-0 border-b border-border/70 p-4">
              <h3 className="text-base font-semibold">Component Palette</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Active assets with connection points ready to drop onto the builder canvas.
              </p>
              <div className="mt-3 flex flex-col gap-2">
              <Input
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
                placeholder="Search assets, types, or connection points..."
              />
              <AppSelect
                value={assetComponentTypeFilter}
                onValueChange={setAssetComponentTypeFilter}
                className="h-9 px-3 text-sm"
                options={[
                  { value: "all", label: "All components" },
                  ...assetComponentTypes.map((componentType) => ({
                    value: componentType,
                    label: componentType,
                  })),
                ]}
              />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
                <div className="grid gap-1.5">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("application/x-builder-asset", asset.id);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => addInstance(asset.id)}
                      className="w-full rounded-xl border border-border/60 bg-card p-2 text-left transition hover:border-primary/50 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-white">
                          {asset.previewUrl ? (
                            <Image
                              src={asset.previewUrl}
                              alt={asset.name}
                              width={asset.width}
                              height={asset.height}
                              unoptimized
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={1.8} className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-foreground">{asset.name}</div>
                          <div className="truncate text-[0.65rem] text-muted-foreground">
                            {asset.componentType}{asset.styleType ? ` • ${asset.styleType}` : ""}
                          </div>
                        </div>
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          strokeWidth={2}
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                      </div>
                    </button>
                  ))}
                  {filteredAssets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
                      No assets match the search.
                    </div>
                  ) : null}
                </div>
              </div>
        </div>
        )}

        <div className="min-h-0 overflow-visible bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,118,110,0.07))] p-4">
          <div className="flex h-full min-h-0 flex-col overflow-visible rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
            <BuilderTopbar
              activeTool={activeTool}
              selectedWireTypeId={selectedWireTypeId}
              wireTypes={wireTypes}
              canUndo={pastSnapshots.length > 0}
              canRedo={futureSnapshots.length > 0}
              zoom={canvasScale}
              canAlign={selectedInstanceIds.length > 0}
              canStraightenWire={Boolean(selectedConnectionId)}
              hasSelectedPoint={Boolean(selectedPoint)}
              hasSelection={Boolean(
                selectedInstanceIds.length > 0 ||
                  selectedShapeIds.length > 0 ||
                  selectedConnectionId
              )}
              canSaveSetup={canPersistSavedSetups}
              saveBusy={isSavingSetup && saveDialogOpen}
              publishBusy={isSavingSetup && publishDialogOpen}
              currentSetupLabel={
                activeSavedSetupName
                  ? `${activeSavedSetupName}${
                      formatSavedSetupLifecycleLabel(
                        savedSetupStatus,
                        activePublishedTemplateId
                      )
                        ? ` (${formatSavedSetupLifecycleLabel(savedSetupStatus, activePublishedTemplateId)})`
                        : ""
                    }`
                  : null
              }
              statusText={
                sessionStatus === "loading"
                  ? "Checking session..."
                  : canPersistSavedSetups
                    ? null
                    : "Saved setups require sign-in."
              }
              onToolChange={setActiveTool}
              onWireTypeChange={setSelectedWireTypeId}
              onUndo={undoBuilder}
              onRedo={redoBuilder}
              onAlign={alignSelectedInstance}
              onZoomOut={() =>
                zoomCanvasAroundPoint(
                  canvasScale - CANVAS_SCALE_STEP,
                  stageRef.current?.getPointerPosition() ?? {
                    x: stageSize.width / 2,
                    y: stageSize.height / 2,
                  }
                )
              }
              onZoomIn={() =>
                zoomCanvasAroundPoint(
                  canvasScale + CANVAS_SCALE_STEP,
                  stageRef.current?.getPointerPosition() ?? {
                    x: stageSize.width / 2,
                    y: stageSize.height / 2,
                  }
                )
              }
              onResetZoom={resetCanvasView}
              onCancelWiring={() => {
                setSelectedPoint(null);
                setHoverPointTarget(null);
              }}
              onStraightenWire={straightenSelectedConnection}
              onDeleteSelection={() => {
                if (selectedConnectionId) {
                  removeSelectedConnection();
                  return;
                }
                if (selectedShapeIds.length > 0) {
                  removeSelectedShapes();
                  return;
                }
                removeSelectedInstances();
              }}
              onClearCanvas={clearCanvas}
              onSave={saveCurrentSetup}
              onSaveAs={openSaveAsDialog}
              onNewComponent={createNewComponent}
              onImportJson={() => importJsonInputRef.current?.click()}
              onExportJson={exportJsonDocument}
              onPublish={openPublishDialog}
              onOpenSavedSetups={openSavedSetupBrowser}
              showLeftPanel={showLeftPanel}
              showRightPanel={showRightPanel}
              onToggleLeftPanel={() => setShowLeftPanel((v) => !v)}
              onToggleRightPanel={() => setShowRightPanel((v) => !v)}
              onImportImage={() => importImageInputRef.current?.click()}
            />
            <div className="border-b border-border/70 px-4 py-3 text-sm text-muted-foreground">
              {canvasMessage}
            </div>
            <div className="min-h-0 flex-1 p-4">
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div
                    ref={stageWrapperRef}
                    className="relative h-full min-h-[620px] rounded-3xl border border-border bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.92))]"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const assetId = event.dataTransfer.getData("application/x-builder-asset");
                      const bounds = stageWrapperRef.current?.getBoundingClientRect();

                      if (assetId && bounds) {
                        // Convert screen position to world coordinates
                        const screenX = event.clientX - bounds.left;
                        const screenY = event.clientY - bounds.top;
                        const worldX = (screenX - canvasOffset.x) / canvasScale;
                        const worldY = (screenY - canvasOffset.y) / canvasScale;
                        addInstance(assetId, worldX, worldY);
                        return;
                      }

                      // Handle image file drop as image shape layer
                      const file = event.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = String(reader.result);
                          const img = new window.Image();
                          img.onload = () => {
                            const maxW = 600;
                            const maxH = 400;
                            const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
                            const width = Math.round(img.naturalWidth * scale);
                            const height = Math.round(img.naturalHeight * scale);
                            const imageShape: import("@/lib/custom-builder-saved-setup-types").BuilderSetupShape = {
                              id: `shape-img-${Date.now()}`,
                              type: "image",
                              name: file.name.replace(/\.[^/.]+$/, "") || "Dropped Image",
                              x: 80,
                              y: 80,
                              width,
                              height,
                              src: dataUrl,
                              rotation: 0,
                              scaleX: 1,
                              scaleY: 1,
                              opacity: 1,
                              fill: "transparent",
                              stroke: "transparent",
                              strokeWidth: 0,
                              visible: true,
                              locked: false,
                            };
                            setShapes((current) => [...current, imageShape]);
                            setSelectedShapeId(imageShape.id);
                            setSelectedShapeIds([imageShape.id]);
                            setSelectedInstanceId(null);
                            setSelectedInstanceIds([]);
                            setSelectedConnectionId(null);
                            setCanvasMessage(`Image "${file.name}" added as a layer.`);
                          };
                          img.src = dataUrl;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <Stage
                      ref={stageRef}
                      width={stageSize.width}
                      height={stageSize.height}
                      x={canvasOffset.x}
                      y={canvasOffset.y}
                      scaleX={canvasScale}
                      scaleY={canvasScale}
                      onMouseMove={(event) => {
                        const position = event.target.getStage()?.getPointerPosition();
                        if (panDragRef.current && position) {
                          setCanvasOffset({
                            x:
                              panDragRef.current.startOffsetX +
                              (position.x - panDragRef.current.startClientX),
                            y:
                              panDragRef.current.startOffsetY +
                              (position.y - panDragRef.current.startClientY),
                          });
                          return;
                        }

                        const nextPointerPosition = position
                          ? {
                              x: (position.x - canvasOffset.x) / canvasScale,
                              y: (position.y - canvasOffset.y) / canvasScale,
                            }
                          : null;
                        setPointerPosition(nextPointerPosition);

                        if (dragConnectionPoint && nextPointerPosition) {
                          const nextHover = getNearestConnectionPointTarget(
                            nextPointerPosition,
                            dragConnectionPoint.source
                          );
                          hoverPointTargetRef.current = nextHover;
                          setHoverPointTarget(nextHover);
                          setDragConnectionPoint((current) => {
                            if (!current || current.moved || !nextPointerPosition) {
                              return current;
                            }

                            const moved =
                              Math.hypot(
                              nextPointerPosition.x - current.startWorld.x,
                              nextPointerPosition.y - current.startWorld.y
                            ) > 6;

                            if (!moved) {
                              return current;
                            }

                            const nextDragState = { ...current, moved: true };
                            dragConnectionPointRef.current = nextDragState;
                            return nextDragState;
                          });
                        } else if (selectedPoint && nextPointerPosition) {
                          const nextHover =
                            getNearestConnectionPointTarget(nextPointerPosition);
                          hoverPointTargetRef.current = nextHover;
                          setHoverPointTarget(nextHover);
                        } else if (selectedPoint || dragConnectionPoint) {
                          hoverPointTargetRef.current = null;
                          setHoverPointTarget(null);
                        }

                        if (selectionBox) {
                          const pointer = getPointerInWorld();

                          if (!pointer) {
                            return;
                          }

                          setSelectionBox((current) =>
                            current
                              ? {
                                  ...current,
                                  current: pointer,
                                }
                              : current
                          );
                          return;
                        }

                        if (draftShape) {
                          updateDraftShape(event.evt.ctrlKey);
                        }
                      }}
                      onMouseDown={(event) => {
                        if (event.target === event.target.getStage()) {
                          if (event.evt.shiftKey) {
                            const position = event.target.getStage()?.getPointerPosition();

                            if (!position) {
                              return;
                            }

                            panDragRef.current = {
                              startClientX: position.x,
                              startClientY: position.y,
                              startOffsetX: canvasOffset.x,
                              startOffsetY: canvasOffset.y,
                            };
                            setSelectionBox(null);
                            return;
                          }

                          if (selectedPoint && hoverPointTarget) {
                            handlePointSelect(
                              hoverPointTarget.instanceId,
                              hoverPointTarget.pointKey
                            );
                            return;
                          }

                          if (activeTool !== "select") {
                            setSelectedPoint(null);
                            setHoverPointTarget(null);
                            setSelectedInstanceId(null);
                            setSelectedInstanceIds([]);
                            setSelectedConnectionId(null);
                            setSelectedShapeId(null);
                            setSelectedShapeIds([]);
                            beginDraftShape(activeTool);
                            return;
                          }

                          const pointer = getPointerInWorld();

                          if (!pointer) {
                            return;
                          }

                          const additive =
                            event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey;

                          selectionAdditiveRef.current = additive;
                          setSelectionBox({
                            start: pointer,
                            current: pointer,
                          });

                          if (!additive) {
                            setSelectedInstanceId(null);
                            setSelectedInstanceIds([]);
                            setSelectedConnectionId(null);
                            setSelectedShapeId(null);
                            setSelectedShapeIds([]);
                            setSelectedPoint(null);
                            setHoverPointTarget(null);
                          }
                        }
                      }}
                      onMouseUp={() => {
                        if (panDragRef.current) {
                          panDragRef.current = null;
                          return;
                        }

                        const activeDragConnectionPoint = dragConnectionPointRef.current;
                        const activeHoverPointTarget = hoverPointTargetRef.current;

                        if (activeDragConnectionPoint) {
                          if (activeDragConnectionPoint.moved && activeHoverPointTarget) {
                            moveConnectionsToPoint(
                              activeDragConnectionPoint.source,
                              activeHoverPointTarget,
                              activeDragConnectionPoint.connectionId,
                              activeDragConnectionPoint.endpoint
                            );
                            suppressPointSelectionRef.current = true;
                          }

                          dragConnectionPointRef.current = null;
                          setDragConnectionPoint(null);
                          hoverPointTargetRef.current = null;
                          setHoverPointTarget(null);

                          if (activeDragConnectionPoint.moved) {
                            return;
                          }
                        }

                        if (draftShape) {
                          commitDraftShape();
                          return;
                        }

                        if (!selectionBox) {
                          return;
                        }

                        const rect = getSelectionRect(selectionBox);
                        const additive = selectionAdditiveRef.current;

                        if (
                          rect &&
                          (rect.width >= MIN_SELECTION_BOX_SIZE ||
                            rect.height >= MIN_SELECTION_BOX_SIZE)
                        ) {
                          const intersectingInstances = instances
                            .map((instance) => ({
                              id: instance.id,
                              node: nodeRefs.current.get(instance.id),
                            }))
                            .filter((entry) => entry.node)
                            .filter(({ node }) => {
                              const bounds = node!.getClientRect({
                                skipShadow: false,
                                skipStroke: false,
                              });

                              return !(
                                bounds.x > rect.x + rect.width ||
                                bounds.x + bounds.width < rect.x ||
                                bounds.y > rect.y + rect.height ||
                                bounds.y + bounds.height < rect.y
                              );
                            })
                            .map((entry) => entry.id);
                          const intersectingShapes = shapes
                            .map((shape) => ({
                              id: shape.id,
                              node: shapeNodeRefs.current.get(shape.id),
                            }))
                            .filter((entry) => entry.node)
                            .filter(({ node }) => {
                              const bounds = node!.getClientRect({
                                skipShadow: false,
                                skipStroke: false,
                              });

                              return !(
                                bounds.x > rect.x + rect.width ||
                                bounds.x + bounds.width < rect.x ||
                                bounds.y > rect.y + rect.height ||
                                bounds.y + bounds.height < rect.y
                              );
                            })
                            .map((entry) => entry.id);

                          const nextSelectedInstanceIds = additive
                            ? Array.from(new Set([...selectedInstanceIds, ...intersectingInstances]))
                            : intersectingInstances;
                          const nextSelectedShapeIds = additive
                            ? Array.from(new Set([...selectedShapeIds, ...intersectingShapes]))
                            : intersectingShapes;

                          setSelectedInstanceIds(nextSelectedInstanceIds);
                          setSelectedInstanceId(nextSelectedInstanceIds[0] ?? null);
                          setSelectedShapeIds(nextSelectedShapeIds);
                          setSelectedShapeId(nextSelectedShapeIds[0] ?? null);

                          if (
                            nextSelectedInstanceIds.length > 0 ||
                            nextSelectedShapeIds.length > 0
                          ) {
                            setSelectedConnectionId(null);
                          }
                        }

                        selectionAdditiveRef.current = false;
                        setSelectionBox(null);
                      }}
                      onWheel={(event) => {
                        event.evt.preventDefault();
                        const pointer = event.target.getStage()?.getPointerPosition();
                        zoomCanvasAroundPoint(
                          canvasScale + (event.evt.deltaY < 0 ? CANVAS_SCALE_STEP : -CANVAS_SCALE_STEP),
                          pointer
                        );
                      }}
                    >
                      <Layer>
                        {Array.from(
                          {
                            length:
                              Math.ceil(
                                (visibleWorldMaxX - visibleWorldMinX) / WIRE_GRID_SIZE
                              ) + 2,
                          },
                          (_, index) =>
                            snapToGrid(visibleWorldMinX) + index * WIRE_GRID_SIZE
                        ).map((x) => (
                          <Line
                            key={`grid-v-${x}`}
                            name="builder-export-hidden"
                            points={[x, visibleWorldMinY, x, visibleWorldMaxY]}
                            stroke={GRID_LINE_COLOR}
                            strokeWidth={1}
                            listening={false}
                          />
                        ))}
                        {Array.from(
                          {
                            length:
                              Math.ceil(
                                (visibleWorldMaxY - visibleWorldMinY) / WIRE_GRID_SIZE
                              ) + 2,
                          },
                          (_, index) =>
                            snapToGrid(visibleWorldMinY) + index * WIRE_GRID_SIZE
                        ).map((y) => (
                          <Line
                            key={`grid-h-${y}`}
                            name="builder-export-hidden"
                            points={[visibleWorldMinX, y, visibleWorldMaxX, y]}
                            stroke={GRID_LINE_COLOR}
                            strokeWidth={1}
                            listening={false}
                          />
                        ))}
                        {selectionBox ? (() => {
                          const rect = getSelectionRect(selectionBox);

                          if (!rect) {
                            return null;
                          }

                          return (
                            <Rect
                              name="builder-export-hidden"
                              x={rect.x}
                              y={rect.y}
                              width={rect.width}
                              height={rect.height}
                              fill="rgba(15,118,110,0.10)"
                              stroke="#0f766e"
                              strokeWidth={1}
                              dash={[6, 4]}
                              listening={false}
                            />
                          );
                        })() : null}
                        {draftShape ? (
                          <BuilderShapeNode
                            shape={createBuilderShapeFromDraft(draftShape)}
                            nodeRef={() => undefined}
                            isSelected={false}
                            onSelect={() => undefined}
                            onDoubleClick={() => undefined}
                            onDragStart={() => undefined}
                            onDragMove={() => undefined}
                            onDragEnd={() => undefined}
                            onTransformEnd={() => undefined}
                          />
                        ) : null}
                        {shapes.map((shape) => (
                          <BuilderShapeNode
                            key={shape.id}
                            shape={shape}
                            nodeRef={(node) => {
                              if (node) {
                                shapeNodeRefs.current.set(shape.id, node);
                              } else {
                                shapeNodeRefs.current.delete(shape.id);
                              }
                            }}
                            isSelected={selectedShapeIds.includes(shape.id)}
                            onSelect={selectShape}
                            onDoubleClick={beginInlineTextEdit}
                            onDragStart={(shapeId) => {
                              beginHistoryTransaction();

                              if (!selectedShapeIds.includes(shapeId)) {
                                setSelectedShapeId(shapeId);
                                setSelectedShapeIds([shapeId]);
                                setSelectedInstanceId(null);
                                setSelectedInstanceIds([]);
                                setSelectedConnectionId(null);
                              }
                            }}
                            onDragMove={(shapeId, x, y) => {
                              updateShape(shapeId, {
                                x: snapToGrid(x),
                                y: snapToGrid(y),
                              });
                            }}
                            onDragEnd={() => {
                              commitHistoryTransaction();
                            }}
                            onTransformEnd={() => {
                              commitTransformedShapes(selectedShapeIds);
                            }}
                          />
                        ))}
                        {instances.map((instance) => {
                          const asset = getAsset(instance.assetId);

                          if (!asset) {
                            return null;
                          }

                          return (
                            <BuilderAssetNode
                              key={instance.id}
                              asset={asset}
                              instance={instance}
                              nodeRef={(node) => {
                                if (node) {
                                  nodeRefs.current.set(instance.id, node);
                                } else {
                                  nodeRefs.current.delete(instance.id);
                                }
                              }}
                              isSelected={selectedInstanceIds.includes(instance.id)}
                              isDeleteMode={false}
                              selectedPoint={selectedPoint}
                              hoverPointTarget={hoverPointTarget}
                              wiringSelectionActive={Boolean(selectedPoint)}
                              hasConnectedPoint={hasConnectedPoint}
                              onPointDragStart={handleConnectionPointDragStart}
                              onSelect={selectInstance}
                              onDragStart={(instanceId, x, y) => {
                                beginHistoryTransaction();
                                const nextSelectedIds = selectedInstanceIds.includes(instanceId)
                                  ? selectedInstanceIds
                                  : [instanceId];

                                if (!selectedInstanceIds.includes(instanceId)) {
                                  setSelectedInstanceId(instanceId);
                                  setSelectedInstanceIds([instanceId]);
                                  setSelectedConnectionId(null);
                                }

                                dragSelectionRef.current = {
                                  lastX: x,
                                  lastY: y,
                                  selectedIds: nextSelectedIds,
                                };
                              }}
                              onMove={(instanceId, x, y) => {
                                const dragState = dragSelectionRef.current;

                                if (!dragState || !dragState.selectedIds.includes(instanceId)) {
                                  updateInstance(instanceId, { x, y });
                                  return;
                                }

                                const deltaX = x - dragState.lastX;
                                const deltaY = y - dragState.lastY;

                                if (deltaX === 0 && deltaY === 0) {
                                  return;
                                }

                                dragSelectionRef.current = {
                                  ...dragState,
                                  lastX: x,
                                  lastY: y,
                                };
                                updateInstances(dragState.selectedIds, (targetInstance) => ({
                                  ...targetInstance,
                                  x: snapToGrid(targetInstance.x + deltaX),
                                  y: snapToGrid(targetInstance.y + deltaY),
                                }));
                              }}
                              onDragEnd={() => {
                                dragSelectionRef.current = null;
                                commitHistoryTransaction();
                              }}
                              onLabelDragStart={(instanceId) => {
                                beginHistoryTransaction();

                                if (!selectedInstanceIds.includes(instanceId)) {
                                  setSelectedInstanceId(instanceId);
                                  setSelectedInstanceIds([instanceId]);
                                  setSelectedConnectionId(null);
                                }
                              }}
                              onLabelDragMove={(instanceId, labelOffsetX, labelOffsetY) => {
                                updateInstance(instanceId, {
                                  labelOffsetX: snapToGrid(labelOffsetX),
                                  labelOffsetY: snapToGrid(labelOffsetY),
                                });
                              }}
                              onLabelDragEnd={() => {
                                commitHistoryTransaction();
                              }}
                              onImageReady={handleImageReady}
                              onTransformEnd={(instanceId, nextValue) => {
                                if (selectedInstanceIds.length === 1) {
                                  updateInstance(instanceId, nextValue);
                                }
                              }}
                              onContextMenuSelect={(instanceId) => {
                                if (!selectedInstanceIds.includes(instanceId)) {
                                  setSelectedInstanceId(instanceId);
                                  setSelectedInstanceIds([instanceId]);
                                  setSelectedConnectionId(null);
                                }
                              }}
                              onPointSelect={handlePointSelect}
                            />
                          );
                        })}
                        {connectionRenderData.map(({ connection, pathPoints, color, bridges }) => {
                          const isSelected = connection.id === selectedConnectionId;
                          const wiringSelectionActive = Boolean(selectedPoint);
                          const from = pathPoints[0];
                          const to = pathPoints[pathPoints.length - 1];
                          const renderedControlPoints = pathPoints.slice(1, -1);
                          const visualStrokeWidth = isSelected ? 5 : 4;
                          const isCurved = connection.tension > 0;

                          return (
                            <React.Fragment key={connection.id}>
                              {isCurved ? (
                                <Line
                                  name="builder-export-content"
                                  points={pathPoints.flatMap((p) => [p.x, p.y])}
                                  stroke={color}
                                  strokeWidth={visualStrokeWidth}
                                  lineCap="round"
                                  lineJoin="round"
                                  tension={connection.tension}
                                  listening={false}
                                />
                              ) : (
                                pathPoints.slice(0, -1).map((point, index) => {
                                  const nextPoint = pathPoints[index + 1];

                                  if (!nextPoint) {
                                    return null;
                                  }

                                  return renderWireSegmentWithBridges({
                                    connectionId: connection.id,
                                    segmentIndex: index,
                                    start: point,
                                    end: nextPoint,
                                    bridges,
                                    color,
                                    strokeWidth: visualStrokeWidth,
                                  });
                                })
                              )}
                              {isCurved ? (
                                <Line
                                  key={`${connection.id}-hit-curved`}
                                  name="builder-export-hidden"
                                  points={pathPoints.flatMap((p) => [p.x, p.y])}
                                  stroke="rgba(15, 23, 42, 0.01)"
                                  strokeWidth={WIRE_HIT_STROKE_WIDTH}
                                  lineCap="round"
                                  tension={connection.tension}
                                  listening={!wiringSelectionActive}
                                  onClick={() => {
                                    setSelectedConnectionId(connection.id);
                                    setSelectedInstanceId(null);
                                    setSelectedInstanceIds([]);
                                  }}
                                  onTap={() => {
                                    setSelectedConnectionId(connection.id);
                                    setSelectedInstanceId(null);
                                    setSelectedInstanceIds([]);
                                  }}
                                  onDblClick={(event) => {
                                    const stage = event.target.getStage();
                                    const position = stage?.getPointerPosition();
                                    if (!position) return;
                                    const worldPoint = {
                                      x: (position.x - canvasOffset.x) / canvasScale,
                                      y: (position.y - canvasOffset.y) / canvasScale,
                                    };
                                    // Find nearest segment to insert point
                                    let bestIndex = 0;
                                    let bestDist = Infinity;
                                    for (let i = 0; i < pathPoints.length - 1; i++) {
                                      const midX = (pathPoints[i].x + pathPoints[i + 1].x) / 2;
                                      const midY = (pathPoints[i].y + pathPoints[i + 1].y) / 2;
                                      const dist = Math.hypot(worldPoint.x - midX, worldPoint.y - midY);
                                      if (dist < bestDist) {
                                        bestDist = dist;
                                        bestIndex = i;
                                      }
                                    }
                                    handleConnectionSegmentInsert(connection.id, bestIndex, worldPoint);
                                    setSelectedConnectionId(connection.id);
                                    setSelectedInstanceId(null);
                                    setSelectedInstanceIds([]);
                                    setCanvasMessage("New control point added to the curved wire.");
                                  }}
                                />
                              ) : (
                              pathPoints.slice(0, -1).map((point, index) => {
                                const nextPoint = pathPoints[index + 1];
                                const isVertical =
                                  Math.abs(point.x - nextPoint.x) < Math.abs(point.y - nextPoint.y);
                                const segmentLength = isVertical
                                  ? Math.abs(point.y - nextPoint.y)
                                  : Math.abs(point.x - nextPoint.x);

                                if (segmentLength < 8) {
                                  return null;
                                }

                                return (
                                  <Line
                                    key={`${connection.id}-segment-${index}`}
                                    name="builder-export-hidden"
                                    points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                                    stroke="rgba(15, 23, 42, 0.01)"
                                    strokeWidth={WIRE_HIT_STROKE_WIDTH}
                                    lineCap="round"
                                    listening={!wiringSelectionActive}
                                    draggable
                                    onDragStart={() => {
                                      beginHistoryTransaction();
                                    }}
                                    onClick={() => {
                                      setSelectedConnectionId(connection.id);
                                      setSelectedInstanceId(null);
                                      setSelectedInstanceIds([]);
                                    }}
                                    onTap={() => {
                                      setSelectedConnectionId(connection.id);
                                      setSelectedInstanceId(null);
                                      setSelectedInstanceIds([]);
                                    }}
                                    onDblClick={(event) => {
                                      const stage = event.target.getStage();
                                      const position = stage?.getPointerPosition();

                                      if (!position) {
                                        return;
                                      }

                                      handleConnectionSegmentInsert(connection.id, index, {
                                        x: (position.x - canvasOffset.x) / canvasScale,
                                        y: (position.y - canvasOffset.y) / canvasScale,
                                      });
                                      setSelectedConnectionId(connection.id);
                                      setSelectedInstanceId(null);
                                      setSelectedInstanceIds([]);
                                      setCanvasMessage("New bend point added to the wire.");
                                    }}
                                    onDragMove={(event) => {
                                      const delta = isVertical ? event.target.x() : event.target.y();
                                      handleConnectionSegmentDrag(
                                        connection.id,
                                        index,
                                        isVertical ? "x" : "y",
                                        delta
                                      );
                                      event.target.position({ x: 0, y: 0 });
                                      setSelectedConnectionId(connection.id);
                                      setSelectedInstanceId(null);
                                      setSelectedInstanceIds([]);
                                    }}
                                    onDragEnd={() => {
                                      commitHistoryTransaction();
                                    }}
                                  />
                                );
                              })
                              )}
                              {isSelected
                                ? renderedControlPoints.map((controlPoint, index) => (
                                    <Circle
                                      key={`${connection.id}-handle-${index}`}
                                      name="builder-export-hidden"
                                      x={controlPoint.x}
                                      y={controlPoint.y}
                                      radius={WIRE_HANDLE_RADIUS}
                                      fill="#ffffff"
                                      stroke={color}
                                      strokeWidth={2}
                                      listening={!wiringSelectionActive}
                                      draggable
                                      onDragStart={() => {
                                        beginHistoryTransaction();
                                      }}
                                      onClick={() => {
                                        setSelectedConnectionId(connection.id);
                                        setSelectedInstanceId(null);
                                        setSelectedInstanceIds([]);
                                      }}
                                      onTap={() => {
                                        setSelectedConnectionId(connection.id);
                                        setSelectedInstanceId(null);
                                        setSelectedInstanceIds([]);
                                      }}
                                      onDblClick={() => {
                                        handleConnectionControlPointRemove(connection.id, index);
                                        setCanvasMessage("Wire bend point removed.");
                                      }}
                                      onDragMove={(event) => {
                                        handleConnectionControlPointDrag(
                                          connection.id,
                                          index,
                                          event.target.x(),
                                          event.target.y()
                                        );
                                      }}
                                      onDragEnd={() => {
                                        commitHistoryTransaction();
                                      }}
                                    />
                                  ))
                                : null}
                              <Circle
                                name="builder-export-content"
                                x={from.x}
                                y={from.y}
                                radius={4}
                                fill={color}
                                listening={false}
                              />
                              <Circle
                                name="builder-export-content"
                                x={to.x}
                                y={to.y}
                                radius={4}
                                fill={color}
                                listening={false}
                              />
                            </React.Fragment>
                          );
                        })}
                        {connectionRenderData.map(({ connection, color, bridges }) => {
                          const isSelected = connection.id === selectedConnectionId;
                          const bridgeStrokeWidth = isSelected ? 5 : 4;

                          return bridges.map((bridge) => (
                            <React.Fragment
                              key={`${connection.id}-bridge-${bridge.segmentIndex}-${bridge.x}-${bridge.y}`}
                            >
                              {bridge.orientation === "horizontal" ? (
                                <Shape
                                  name="builder-export-content"
                                  stroke={color}
                                  strokeWidth={bridgeStrokeWidth}
                                  sceneFunc={(context, shape) => {
                                    context.beginPath();
                                    context.arc(
                                      bridge.x,
                                      bridge.y,
                                      WIRE_BRIDGE_RADIUS,
                                      Math.PI,
                                      0,
                                      false
                                    );
                                    context.strokeShape(shape);
                                  }}
                                  listening={false}
                                />
                              ) : (
                                <Shape
                                  name="builder-export-content"
                                  stroke={color}
                                  strokeWidth={bridgeStrokeWidth}
                                  sceneFunc={(context, shape) => {
                                    context.beginPath();
                                    context.arc(
                                      bridge.x,
                                      bridge.y,
                                      WIRE_BRIDGE_RADIUS,
                                      -Math.PI / 2,
                                      Math.PI / 2,
                                      false
                                    );
                                    context.strokeShape(shape);
                                  }}
                                  listening={false}
                                />
                              )}
                            </React.Fragment>
                          ));
                        })}
                        {instances.map((instance) => {
                          const asset = getAsset(instance.assetId);

                          if (!asset) {
                            return null;
                          }

                          return (
                            <BuilderAssetNode
                              key={`${instance.id}-points-overlay`}
                              asset={asset}
                              instance={instance}
                              nodeRef={() => undefined}
                              isSelected={selectedInstanceIds.includes(instance.id)}
                              isDeleteMode={false}
                              selectedPoint={selectedPoint}
                              hoverPointTarget={hoverPointTarget}
                              wiringSelectionActive
                              hasConnectedPoint={hasConnectedPoint}
                              onPointDragStart={handleConnectionPointDragStart}
                              renderMode="points-only"
                              onSelect={selectInstance}
                              onDragStart={() => undefined}
                              onMove={() => undefined}
                              onDragEnd={() => undefined}
                              onLabelDragStart={() => undefined}
                              onLabelDragMove={() => undefined}
                              onLabelDragEnd={() => undefined}
                              onImageReady={handleImageReady}
                              onTransformEnd={() => undefined}
                              onContextMenuSelect={() => undefined}
                              onPointSelect={handlePointSelect}
                            />
                          );
                        })}
                        {selectedPoint && pointerPosition ? (() => {
                          const point = getPoint(selectedPoint.instanceId, selectedPoint.pointKey);
                          const hoverPoint =
                            hoverPointTarget
                              ? getPoint(hoverPointTarget.instanceId, hoverPointTarget.pointKey)
                              : null;

                          if (!point) {
                            return null;
                          }

                          return (
                            <Line
                              name="builder-export-hidden"
                              points={[
                                point.x,
                                point.y,
                                hoverPoint?.x ?? pointerPosition.x,
                                hoverPoint?.y ?? pointerPosition.y,
                              ]}
                              stroke="#f97316"
                              strokeWidth={3}
                              dash={[10, 8]}
                              lineCap="round"
                            />
                          );
                        })() : null}
                        <Transformer
                          name="builder-export-hidden"
                          ref={transformerRef}
                          rotateEnabled
                          keepRatio
                          enabledAnchors={[
                            "top-left",
                            "top-right",
                            "bottom-left",
                            "bottom-right",
                          ]}
                          borderStroke="#0f766e"
                          anchorStroke="#0f766e"
                          anchorFill="#ffffff"
                          anchorSize={8}
                          onTransformStart={() => {
                            beginHistoryTransaction();
                            transformSelectionRef.current = new Map(
                              selectedInstanceIds.map((instanceId) => {
                                const node = nodeRefs.current.get(instanceId);

                                return [
                                  instanceId,
                                  {
                                    x: node?.x() ?? 0,
                                    y: node?.y() ?? 0,
                                    scale: node?.scaleX() ?? 1,
                                    rotation: node?.rotation() ?? 0,
                                  },
                                ];
                              })
                            );
                          }}
                          onTransformEnd={() => {
                            commitTransformedInstances(selectedInstanceIds);
                            transformSelectionRef.current.clear();
                            commitHistoryTransaction();
                          }}
                        />
                        <Transformer
                          name="builder-export-hidden"
                          ref={shapeTransformerRef}
                          rotateEnabled
                          enabledAnchors={[
                            "top-left",
                            "top-center",
                            "top-right",
                            "middle-left",
                            "middle-right",
                            "bottom-left",
                            "bottom-center",
                            "bottom-right",
                          ]}
                          borderStroke="#0f766e"
                          anchorStroke="#0f766e"
                          anchorFill="#ffffff"
                          anchorSize={8}
                          onTransformStart={() => {
                            beginHistoryTransaction();
                          }}
                          onTransformEnd={() => {
                            commitTransformedShapes(selectedShapeIds);
                            commitHistoryTransaction();
                          }}
                        />
                      </Layer>
                    </Stage>
                    {inlineTextEditor ? (
                      <textarea
                        ref={inlineTextEditorRef}
                        value={inlineTextEditor.value}
                        onChange={(event) =>
                          setInlineTextEditor((current) =>
                            current
                              ? {
                                  ...current,
                                  value: event.target.value,
                                }
                              : current
                          )
                        }
                        onBlur={commitInlineTextEdit}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelInlineTextEdit();
                            return;
                          }

                          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                            event.preventDefault();
                            commitInlineTextEdit();
                          }
                        }}
                        className="absolute z-30 resize-none overflow-hidden border border-primary/30 bg-background/95 px-2 py-1 outline-none ring-2 ring-primary/20"
                        style={inlineTextEditor.style}
                      />
                    ) : null}
                    {instances.length === 0 && shapes.length === 0 ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="max-w-sm rounded-3xl border border-border/70 bg-background/92 px-6 py-5 text-center shadow-sm">
                          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={2} />
                          </div>
                          <div className="font-medium text-foreground">Canvas is empty</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Drag an asset from the left or select a shape tool to start drawing in the builder.
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Component Options</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuCheckboxItem
                    checked={
                      selectedInstances.length > 0 &&
                      selectedInstances.every((instance) => instance.showLabel)
                    }
                    disabled={selectedInstanceIds.length === 0}
                    onCheckedChange={(checked) => {
                      setSelectedInstanceLabelVisibility(checked === true);
                    }}
                  >
                    Label
                  </ContextMenuCheckboxItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          </div>
        </div>

        {showRightPanel && (
        <div className="min-h-0 overflow-auto border-l border-border/70 bg-background/95 p-4">
          <div className="grid gap-4">
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Properties</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                {selectedInstanceIds.length > 1 ? (
                  <>
                    <div>
                      <div className="font-medium text-foreground">
                        {selectedInstanceIds.length} component(s) selected
                      </div>
                      <div className="text-muted-foreground">
                        Use align, drag, delete, or toggle label for bulk editing.
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedInstanceLabelVisibility(
                          !selectedInstances.every((instance) => instance.showLabel)
                        )
                      }
                    >
                      <HugeiconsIcon
                        icon={
                          selectedInstances.every((instance) => instance.showLabel)
                            ? ViewOffIcon
                            : ViewIcon
                        }
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      {selectedInstances.every((instance) => instance.showLabel)
                        ? "Hide Labels"
                        : "Show Labels"}
                    </Button>
                  </>
                ) : selectedInstance ? (
                  <>
                    <div>
                      <div className="font-medium text-foreground">{selectedInstance.name}</div>
                      <div className="text-muted-foreground">{selectedInstance.componentType}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">X</span>
                        <Input
                          type="number"
                          value={Math.round(selectedInstance.x)}
                          onChange={(event) =>
                            updateInstance(selectedInstance.id, {
                              x: snapToGrid(Number(event.target.value || 0)),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Y</span>
                        <Input
                          type="number"
                          value={Math.round(selectedInstance.y)}
                          onChange={(event) =>
                            updateInstance(selectedInstance.id, {
                              y: snapToGrid(Number(event.target.value || 0)),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Scale</span>
                        <Input
                          type="number"
                          min="0.2"
                          step="0.1"
                          value={selectedInstance.scale.toFixed(2)}
                          onChange={(event) =>
                            updateInstance(selectedInstance.id, {
                              scale: Math.max(0.2, Number(event.target.value || 0.2)),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rotate</span>
                        <Input
                          type="number"
                          step="1"
                          value={Math.round(selectedInstance.rotation)}
                          onChange={(event) =>
                            updateInstance(selectedInstance.id, {
                              rotation: Number(event.target.value || 0),
                            })
                          }
                        />
                      </label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleInstanceLabel(selectedInstance.id)}>
                      <HugeiconsIcon icon={selectedInstance.showLabel ? ViewOffIcon : ViewIcon} strokeWidth={2} data-icon="inline-start" />
                      {selectedInstance.showLabel ? "Hide Label" : "Show Label"}
                    </Button>
                    {selectedInstance.showLabel ? (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1.5">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Label X</span>
                          <Input
                            type="number"
                            value={Math.round(selectedInstance.labelOffsetX)}
                            onChange={(event) =>
                              updateInstance(selectedInstance.id, {
                                labelOffsetX: snapToGrid(Number(event.target.value || 0)),
                              })
                            }
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Label Y</span>
                          <Input
                            type="number"
                            value={Math.round(selectedInstance.labelOffsetY)}
                            onChange={(event) =>
                              updateInstance(selectedInstance.id, {
                                labelOffsetY: snapToGrid(Number(event.target.value || 0)),
                              })
                            }
                          />
                        </label>
                      </div>
                    ) : null}
                  </>
                ) : selectedShape ? (
                  <>
                    <div>
                      <div className="font-medium text-foreground">{selectedShape.name}</div>
                      <div className="text-muted-foreground capitalize">{selectedShape.type}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">X</span>
                        <Input
                          type="number"
                          value={Math.round(selectedShape.x)}
                          onChange={(event) =>
                            updateShape(selectedShape.id, {
                              x: snapToGrid(Number(event.target.value || 0)),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Y</span>
                        <Input
                          type="number"
                          value={Math.round(selectedShape.y)}
                          onChange={(event) =>
                            updateShape(selectedShape.id, {
                              y: snapToGrid(Number(event.target.value || 0)),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rotate</span>
                        <Input
                          type="number"
                          step="1"
                          value={Math.round(selectedShape.rotation)}
                          onChange={(event) =>
                            updateShape(selectedShape.id, {
                              rotation: Number(event.target.value || 0),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Stroke</span>
                        <Input
                          type="number"
                          min={selectedShape.type === "text" ? "0" : "1"}
                          step="1"
                          value={selectedShape.strokeWidth}
                          onChange={(event) =>
                            updateShape(selectedShape.id, {
                              strokeWidth: Math.max(
                                selectedShape.type === "text" ? 0 : 1,
                                Number(
                                  event.target.value ||
                                    (selectedShape.type === "text" ? 0 : 1)
                                )
                              ),
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Outline Color</span>
                        <input
                          type="color"
                          value={
                            isTransparentColor(selectedShape.stroke)
                              ? "#111827"
                              : selectedShape.stroke
                          }
                          onChange={(event) =>
                            updateShape(selectedShape.id, {
                              stroke: event.target.value,
                            })
                          }
                          className="h-9 w-full rounded-md border border-input bg-input/20 px-1.5 py-1 outline-none"
                        />
                      </label>
                      {selectedShape.type === "text" ? (
                        <>
                          <label className="grid gap-1.5 col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Text</span>
                            <textarea
                              value={selectedShape.text}
                              onChange={(event) =>
                                updateShape(
                                  selectedShape.id,
                                  withAutoSizedTextDimensions({
                                    ...selectedShape,
                                    text: event.target.value,
                                  })
                                )
                              }
                              rows={3}
                              className="min-h-20 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none"
                            />
                          </label>
                          <label className="grid gap-1.5">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Font Size</span>
                            <Input
                              type="number"
                              min="8"
                              value={selectedShape.fontSize}
                              onChange={(event) =>
                                updateShape(
                                  selectedShape.id,
                                  withAutoSizedTextDimensions({
                                    ...selectedShape,
                                    fontSize: Math.max(8, Number(event.target.value || 8)),
                                  })
                                )
                              }
                            />
                          </label>
                          <div className="grid gap-1.5">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Text Style</span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  (selectedShape.fontStyle ?? "normal").includes("bold")
                                    ? "secondary"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateShape(
                                    selectedShape.id,
                                    toggleTextFontStyle(selectedShape, "bold")
                                  )
                                }
                              >
                                Bold
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  (selectedShape.fontStyle ?? "normal").includes("italic")
                                    ? "secondary"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateShape(
                                    selectedShape.id,
                                    toggleTextFontStyle(selectedShape, "italic")
                                  )
                                }
                              >
                                Italic
                              </Button>
                            </div>
                          </div>
                          <div className="grid gap-1.5 col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Text Align</span>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant={selectedShape.textAlign === "left" ? "secondary" : "outline"}
                                size="sm"
                                onClick={() =>
                                  updateShape(selectedShape.id, { textAlign: "left" } as Partial<TextObject>)
                                }
                              >
                                <HugeiconsIcon icon={TextAlignLeftIcon} strokeWidth={2} data-icon="inline-start" />
                                Left
                              </Button>
                              <Button
                                type="button"
                                variant={selectedShape.textAlign === "center" ? "secondary" : "outline"}
                                size="sm"
                                onClick={() =>
                                  updateShape(selectedShape.id, { textAlign: "center" } as Partial<TextObject>)
                                }
                              >
                                <HugeiconsIcon icon={TextAlignCenterIcon} strokeWidth={2} data-icon="inline-start" />
                                Center
                              </Button>
                              <Button
                                type="button"
                                variant={selectedShape.textAlign === "right" ? "secondary" : "outline"}
                                size="sm"
                                onClick={() =>
                                  updateShape(selectedShape.id, { textAlign: "right" } as Partial<TextObject>)
                                }
                              >
                                <HugeiconsIcon icon={TextAlignRightIcon} strokeWidth={2} data-icon="inline-start" />
                                Right
                              </Button>
                            </div>
                          </div>
                          <div className="grid gap-1.5 col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Fill Color</span>
                            <input
                              type="color"
                              value={selectedShape.fill}
                              onChange={(event) =>
                                updateShape(selectedShape.id, {
                                  fill: event.target.value,
                                } as Partial<TextObject>)
                              }
                              className="h-9 w-full rounded-md border border-input bg-input/20 px-1.5 py-1 outline-none"
                            />
                          </div>
                        </>
                      ) : selectedShape.type !== "line" ? (
                        <>
                          <div className="grid gap-1.5">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Fill Color</span>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={
                                  isTransparentColor(selectedShape.fill)
                                    ? "#ffffff"
                                    : selectedShape.fill
                                }
                                disabled={isTransparentColor(selectedShape.fill)}
                                onChange={(event) =>
                                  updateShape(selectedShape.id, {
                                    fill: event.target.value,
                                  } as Partial<RectangleObject | EllipseObject>)
                                }
                                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-input/20 px-1.5 py-1 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <label className="flex shrink-0 items-center gap-2 rounded-md border border-input bg-input/10 px-3 py-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={isTransparentColor(selectedShape.fill)}
                                  onChange={(event) =>
                                    updateShape(selectedShape.id, {
                                      fill: event.target.checked ? "transparent" : "#f59e0b",
                                    } as Partial<RectangleObject | EllipseObject>)
                                  }
                                  className="size-4"
                                />
                                <span>No Fill</span>
                              </label>
                            </div>
                          </div>
                          <label className="grid gap-1.5">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Width</span>
                            <Input
                              type="number"
                              min="10"
                              value={Math.round(selectedShape.width)}
                              onChange={(event) =>
                                updateShape(selectedShape.id, {
                                  width: Math.max(10, Number(event.target.value || 10)),
                                } as Partial<RectangleObject | EllipseObject>)
                              }
                            />
                          </label>
                          <label className="grid gap-1.5">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Height</span>
                            <Input
                              type="number"
                              min="10"
                              value={Math.round(selectedShape.height)}
                              onChange={(event) =>
                                updateShape(selectedShape.id, {
                                  height: Math.max(10, Number(event.target.value || 10)),
                                } as Partial<RectangleObject | EllipseObject>)
                              }
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : selectedConnection ? (
                  <>
                    <div className="font-medium text-foreground">Wire Connection</div>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Wire Type</span>
                      <AppSelect
                        value={selectedConnection.wireTypeId}
                        onValueChange={(value) =>
                          updateConnectionWireType(selectedConnection.id, value)
                        }
                        className="h-9 px-3 text-sm"
                        options={wireTypes.map((wireType) => ({
                          value: wireType.id,
                          label: wireType.name,
                        }))}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Wire Style</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedConnection.tension === 0 ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setConnections((cur) =>
                              cur.map((c) => c.id === selectedConnection.id ? { ...c, tension: 0 } : c)
                            );
                          }}
                        >
                          Straight
                        </Button>
                        <Button
                          variant={selectedConnection.tension > 0 ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setConnections((cur) =>
                              cur.map((c) => c.id === selectedConnection.id ? { ...c, tension: 0.35 } : c)
                            );
                          }}
                        >
                          Curved
                        </Button>
                      </div>
                    </label>
                    {selectedConnection.tension > 0 && (
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Curve Amount</span>
                        <Input
                          type="number"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={selectedConnection.tension}
                          onChange={(e) => {
                            const val = Math.max(0.05, Math.min(1, Number(e.target.value || 0.35)));
                            setConnections((cur) =>
                              cur.map((c) => c.id === selectedConnection.id ? { ...c, tension: val } : c)
                            );
                          }}
                        />
                      </label>
                    )}
                    <Button variant="outline" size="sm" onClick={straightenSelectedConnection}>
                      Straighten Wire
                    </Button>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    Select a component or wire on the canvas to edit its properties.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Layers</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
                  Drag layer cards to reorder front-to-back within the same category.
                </div>
                <div className="grid gap-2">
                  {visibleLayers.map((layer) => (
                    <div
                      key={`${layer.kind}-${layer.id}`}
                      draggable
                      onDragStart={() => setDraggedLayer({ id: layer.id, kind: layer.kind })}
                      onDragEnd={() => setDraggedLayer(null)}
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();

                        if (!draggedLayer) {
                          return;
                        }

                        moveBuilderLayer(draggedLayer, {
                          id: layer.id,
                          kind: layer.kind,
                        });
                        setDraggedLayer(null);
                      }}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        layer.selected
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/70 bg-muted/25 hover:bg-muted/40"
                      } ${draggedLayer?.id === layer.id && draggedLayer.kind === layer.kind ? "opacity-55" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          if (layer.kind === "connection") {
                            setSelectedConnectionId(layer.id);
                            setSelectedInstanceId(null);
                            setSelectedInstanceIds([]);
                            setSelectedShapeId(null);
                            setSelectedShapeIds([]);
                            return;
                          }

                          if (layer.kind === "shape") {
                            selectShape(
                              layer.id,
                              event.shiftKey || event.ctrlKey || event.metaKey
                            );
                            return;
                          }

                          selectInstance(
                            layer.id,
                            event.shiftKey || event.ctrlKey || event.metaKey
                          );
                        }}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <div className="mt-0.5 text-muted-foreground">
                          <HugeiconsIcon icon={Move01Icon} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">{layer.label}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {layer.meta}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
                {visibleLayers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No active layers in the builder yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <div>Delete / Backspace to delete selection.</div>
                <div>Arrow Keys to move components per grid.</div>
                <div>Shift + Arrow Keys to move further.</div>
                <div>Shift + Drag on empty area to pan the canvas.</div>
                <div>Shift/Ctrl/Cmd + Click to multi-select components.</div>
                <div>Drag mouse on empty canvas area for box select.</div>
                <div>Ctrl/Cmd + C and Ctrl/Cmd + V to copy paste components.</div>
                <div>Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z / Y for undo redo.</div>
                <div>Ctrl/Cmd + +, -, 0 for zoom in, out, and reset.</div>
                <div>S to straighten wire, L to toggle label, C to cancel wiring.</div>
                <div>Esc to clear active selection.</div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{saveDialogMode === "saveAs" ? "Save As" : "Save Draft"}</DialogTitle>
            <DialogDescription>
              {saveDialogMode === "saveAs"
                ? "Save the current builder setup as a new draft."
                : "Save the current builder setup as a draft."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 pb-2">
            <div className="grid gap-1.5">
              <label htmlFor="builder-setup-name" className="text-sm font-medium text-foreground">
                Setup name
              </label>
              <Input
                id="builder-setup-name"
                value={setupNameInput}
                onChange={(event) => setSetupNameInput(event.target.value)}
                placeholder="e.g. Strat HSS Modern Wiring"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="builder-setup-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="builder-setup-description"
                value={setupDescriptionInput}
                onChange={(event) => setSetupDescriptionInput(event.target.value)}
                placeholder="Brief notes about this setup."
                className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isSavingSetup}
              onClick={() => {
                void saveSetupDraft({
                  forceCreateNew: saveDialogMode === "saveAs",
                });
              }}
            >
              {isSavingSetup
                ? "Saving..."
                : saveDialogMode === "saveAs"
                  ? "Save As"
                  : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSavingSetup && !publishDialogOpen} onOpenChange={() => undefined}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader className="items-center text-center">
            <DialogTitle>Saving Draft</DialogTitle>
            <DialogDescription>
              Please wait. The builder draft is being saved.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Publish to Wiring Templates</DialogTitle>
            <DialogDescription>
              Create an official template from the custom builder and save it to the wiring templates table.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 pb-2 sm:grid-cols-2">
            {publishErrorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2">
                {publishErrorMessage}
              </div>
            ) : null}
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium">Name</span>
              <Input
                value={publishForm.name}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: slugifyBuilderSetupName(event.target.value),
                  }))
                }
                placeholder="Strat Standard SSS 5-Way"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Slug</span>
              <Input
                value={publishForm.slug}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    slug: slugifyBuilderSetupName(event.target.value),
                  }))
                }
                placeholder="strat-standard-sss-5-way"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Difficulty Level</span>
              <Input
                value={publishForm.difficultyLevel}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    difficultyLevel: event.target.value,
                  }))
                }
                placeholder="Intermediate"
              />
            </label>
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:col-span-2">
              <div className="text-sm font-medium text-foreground">Detected From Canvas</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Pickup
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.pickups.length > 0
                      ? publishCanvasInventory.pickups
                          .map((item) => `${item.role}: ${item.name}`)
                          .join(", ")
                      : "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Potentiometer
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.potentiometers.length > 0
                      ? publishCanvasInventory.potentiometers
                          .map((item) =>
                            item.role === "other"
                              ? item.name
                              : `${item.name} (${item.role})`
                          )
                          .join(", ")
                      : "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Switch
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.switches.join(", ") || "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Capacitor
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.capacitors.join(", ") || "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Resistor
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.resistors.join(", ") || "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Output
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.outputs.join(", ") || "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Mods
                  </div>
                  <div className="text-sm text-foreground">
                    {publishCanvasInventory.mods.join(", ") || "-"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Counts
                  </div>
                  <div className="text-sm text-foreground">
                    {publishForm.volumeCount} Volume / {publishForm.toneCount} Tone
                  </div>
                </div>
              </div>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Source Type</span>
              <Input
                value={publishForm.sourceType}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    sourceType: event.target.value,
                  }))
                }
                placeholder="Custom Builder"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Source URL</span>
              <Input
                value={publishForm.sourceUrl}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    sourceUrl: event.target.value,
                  }))
                }
                placeholder="https://example.com/reference"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium">Description</span>
              <textarea
                value={publishForm.description}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="min-h-20 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none"
                placeholder="Brief notes about this wiring template."
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium">Tags</span>
              <Input
                value={publishForm.tags}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    tags: event.target.value,
                  }))
                }
                placeholder="strat, sss, 5-way, vintage (comma separated)"
              />
              <span className="text-[0.65rem] text-muted-foreground">
                Separate tags with commas. Used for search and filtering.
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={publishForm.isVerified}
                onChange={(event) =>
                  setPublishForm((current) => ({
                    ...current,
                    isVerified: event.target.checked,
                  }))
                }
              />
              Mark template as verified
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                isSavingSetup ||
                !publishForm.name.trim() ||
                !publishForm.slug.trim() ||
                publishForm.volumeCount < 0 ||
                publishForm.toneCount < 0
              }
              onClick={() => {
                void publishToWiringTemplate();
              }}
            >
              {isSavingSetup ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={savedSetupBrowserOpen} onOpenChange={setSavedSetupBrowserOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Open Design</DialogTitle>
            <DialogDescription>
              Browse, search, and load your saved wiring setups.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 pb-2">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search setups..."
                className="h-9 flex-1 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                onChange={(e) => setSavedSetupBrowserQuery(e.target.value.toLowerCase())}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!canPersistSavedSetups || isLoadingSavedSetups}
                onClick={() => { void loadSavedSetups(); }}
              >
                {isLoadingSavedSetups ? "Loading..." : "Refresh"}
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              {filteredSavedSetups.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-12 text-center">
                  <div className="text-sm text-muted-foreground">
                    {isLoadingSavedSetups
                      ? "Loading setups..."
                      : savedSetups.length === 0
                        ? "No saved setups yet. Save your first wiring to see it here."
                        : "No setups match your search."}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSavedSetups.map((setup) => (
                    <div
                      key={setup.id}
                      className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <button
                        type="button"
                        className="relative block aspect-[4/3] w-full overflow-hidden bg-white dark:bg-neutral-100"
                        onClick={() => {
                          loadSavedSetupIntoCanvas(setup);
                          setSavedSetupBrowserOpen(false);
                        }}
                      >
                        {setup.thumbnailUrl ? (
                          <img
                            src={setup.thumbnailUrl}
                            alt={setup.name}
                            className="h-full w-full object-contain object-center"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-teal-700/70" />
                        )}
                      </button>
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">{setup.name}</p>
                          <p className="truncate text-[0.65rem] text-muted-foreground">
                            {setup.status}{setup.publishedTemplateId ? " • Published" : ""}
                            {" • "}{new Date(setup.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          disabled={savedSetupActionId === setup.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteSavedSetup(setup.id);
                          }}
                        >
                          {savedSetupActionId === setup.id ? "..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
