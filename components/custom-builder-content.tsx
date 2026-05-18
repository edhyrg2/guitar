"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  Cancel01Icon,
  Delete02Icon,
  PaintBrush02Icon,
  PlusSignIcon,
  Redo02Icon,
  SearchAddIcon,
  SearchMinusIcon,
  Undo02Icon,
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
import { Input } from "@/components/ui/input";
import type { WireTypeRow } from "@/lib/wire-type-types";

export type BuilderAssetDefinition = {
  id: string;
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

type BuilderConnection = {
  id: string;
  fromInstanceId: string;
  fromPointKey: string;
  toInstanceId: string;
  toPointKey: string;
  wireTypeId: string;
  controlPoints: { x: number; y: number }[];
};

type SelectedPoint = {
  instanceId: string;
  pointKey: string;
};

type SelectionBox = {
  start: { x: number; y: number };
  current: { x: number; y: number };
} | null;

type BuilderSnapshot = {
  instances: BuilderInstance[];
  connections: BuilderConnection[];
};

type CustomBuilderContentProps = {
  assets: BuilderAssetDefinition[];
  wireTypes: WireTypeRow[];
};

const INITIAL_MAX_COMPONENT_WIDTH = 280;
const INITIAL_MAX_COMPONENT_HEIGHT = 180;
const CONNECTION_POINT_RADIUS = 6;
const CONNECTION_POINT_ACTIVE_RADIUS = 8;
const CONNECTION_POINT_RING_RADIUS = 11;
const CONNECTION_POINT_ACTIVE_RING_RADIUS = 14;
const WIRE_HIT_STROKE_WIDTH = 18;
const WIRE_HANDLE_RADIUS = 7;
const WIRE_GRID_SIZE = 12;
const GRID_LINE_COLOR = "rgba(148, 163, 184, 0.18)";
const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2.5;
const CANVAS_SCALE_STEP = 0.2;
const MIN_SELECTION_BOX_SIZE = 8;

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

function flattenPathPoints(points: { x: number; y: number }[]) {
  return points.flatMap((point) => [point.x, point.y]);
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

function createBuilderSnapshot(
  instances: BuilderInstance[],
  connections: BuilderConnection[]
): BuilderSnapshot {
  return {
    instances: cloneInstances(instances),
    connections: cloneConnections(connections),
  };
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
  onSelect,
  onDragStart,
  onMove,
  onDragEnd,
  onImageReady,
  onTransformEnd,
  onContextMenuSelect,
  onPointSelect,
  }: {
  asset: BuilderAssetDefinition;
  instance: BuilderInstance;
  nodeRef: (node: React.ElementRef<typeof Group> | null) => void;
  isSelected: boolean;
  isDeleteMode: boolean;
  selectedPoint: SelectedPoint | null;
    onSelect: (instanceId: string, additive?: boolean) => void;
    onDragStart: (instanceId: string, x: number, y: number) => void;
    onMove: (instanceId: string, x: number, y: number) => void;
    onDragEnd: () => void;
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
      ref={nodeRef}
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      scaleX={instance.scale}
      scaleY={instance.scale}
      draggable={!isDeleteMode}
        onClick={(event) =>
          onSelect(
            instance.id,
            event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey
          )
        }
        onTap={() => onSelect(instance.id)}
        onDragStart={(event) => {
          event.cancelBubble = true;
          onDragStart(instance.id, snapToGrid(event.target.x()), snapToGrid(event.target.y()));
        }}
        onDragMove={(event) => {
          event.cancelBubble = true;
          onMove(instance.id, snapToGrid(event.target.x()), snapToGrid(event.target.y()));
        }}
        onDragEnd={(event) => {
          event.cancelBubble = true;
          onDragEnd();
        }}
      onContextMenu={() => {
        onContextMenuSelect(instance.id);
      }}
      onTransformEnd={(event) => {
        onTransformEnd(instance.id, {
          x: snapToGrid(event.target.x()),
          y: snapToGrid(event.target.y()),
          scale: Math.max(0.2, event.target.scaleX()),
          rotation: event.target.rotation(),
        });
      }}
    >
      <Rect
        width={sourceWidth}
        height={sourceHeight}
        fill="rgba(0,0,0,0)"
        strokeEnabled={false}
      />
      {image ? (
        <KonvaImage
          image={image}
          width={sourceWidth}
          height={sourceHeight}
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
          stroke={isSelected ? "#0f766e" : "#cbd5e1"}
          strokeWidth={isSelected ? 2 : 1}
        />
      )}
      {asset.connectionPoints.map((point) => {
        const active =
          selectedPoint?.instanceId === instance.id &&
          selectedPoint.pointKey === point.pointKey;

        return (
          <Group
            key={point.pointKey}
            x={point.x * widthRatio}
            y={point.y * heightRatio}
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
              radius={(active ? CONNECTION_POINT_ACTIVE_RADIUS : CONNECTION_POINT_RADIUS) * markerScale}
              fill={active ? "#f97316" : point.color ?? "#0f766e"}
              stroke="#ffffff"
              strokeWidth={2 * markerScale}
            />
            <Circle
              radius={(active ? CONNECTION_POINT_ACTIVE_RING_RADIUS : CONNECTION_POINT_RING_RADIUS) * markerScale}
              stroke={point.color ?? "#0f766e"}
              strokeWidth={markerScale}
              dash={[3 * markerScale, 3 * markerScale]}
            />
          </Group>
        );
      })}
      {instance.showLabel ? (
        <Text
          x={0}
          y={sourceHeight + 8}
          text={instance.name}
          fontSize={12 * markerScale}
          fill="#0f172a"
          padding={4 * markerScale}
          width={Math.max(sourceWidth, 120)}
        />
      ) : null}
    </Group>
  );
}

function BuilderTopbar({
  selectedWireTypeId,
  wireTypes,
  canUndo,
  canRedo,
  zoom,
  canAlign,
  canStraightenWire,
  hasSelectedPoint,
  hasSelection,
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
}: {
  selectedWireTypeId: string;
  wireTypes: WireTypeRow[];
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  canAlign: boolean;
  canStraightenWire: boolean;
  hasSelectedPoint: boolean;
  hasSelection: boolean;
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
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" disabled={!canUndo} onClick={onUndo}>
          <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} data-icon="inline-start" />
          Undo
        </Button>
        <Button variant="secondary" size="sm" disabled={!canRedo} onClick={onRedo}>
          <HugeiconsIcon icon={Redo02Icon} strokeWidth={2} data-icon="inline-start" />
          Redo
        </Button>
        <select
          value={selectedWireTypeId}
          onChange={(event) => onWireTypeChange(event.target.value)}
          className="h-9 min-w-56 rounded-md border border-border bg-background px-3 text-sm outline-none"
        >
          {wireTypes.map((wireType) => (
            <option key={wireType.id} value={wireType.id}>
              {wireType.name}
            </option>
          ))}
        </select>
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

      <div className="flex flex-wrap items-center justify-end gap-2">
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
      </div>
    </div>
  );
}

export function CustomBuilderContent({
  assets,
  wireTypes,
}: CustomBuilderContentProps) {
  const [instances, setInstances] = React.useState<BuilderInstance[]>([]);
  const [connections, setConnections] = React.useState<BuilderConnection[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(null);
  const [selectedInstanceIds, setSelectedInstanceIds] = React.useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = React.useState<SelectedPoint | null>(null);
  const [selectedWireTypeId, setSelectedWireTypeId] = React.useState<string>(
    wireTypes[0]?.id ?? ""
  );
  const [pastSnapshots, setPastSnapshots] = React.useState<BuilderSnapshot[]>([]);
  const [futureSnapshots, setFutureSnapshots] = React.useState<BuilderSnapshot[]>([]);
  const [assetQuery, setAssetQuery] = React.useState("");
  const [assetComponentTypeFilter, setAssetComponentTypeFilter] = React.useState("all");
  const [canvasMessage, setCanvasMessage] = React.useState(
    "Drag asset dari panel kiri ke canvas, lalu klik dua connection point untuk membuat wiring."
  );
  const [stageSize, setStageSize] = React.useState({ width: 960, height: 720 });
  const [canvasScale, setCanvasScale] = React.useState(1);
  const [selectionBox, setSelectionBox] = React.useState<SelectionBox>(null);
  const [pointerPosition, setPointerPosition] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const deferredAssetQuery = React.useDeferredValue(assetQuery);
  const stageWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const transformerRef = React.useRef<React.ElementRef<typeof Transformer> | null>(null);
  const nodeRefs = React.useRef(new Map<string, React.ElementRef<typeof Group>>());
  const dragSelectionRef = React.useRef<{
    lastX: number;
    lastY: number;
    selectedIds: string[];
  } | null>(null);
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
  const historyTransactionDepthRef = React.useRef(0);
  const historyTransactionSnapshotRef = React.useRef<BuilderSnapshot | null>(null);
  const stageRef = React.useRef<React.ElementRef<typeof Stage> | null>(null);
  const nextIdRef = React.useRef(1);
  const worldViewportWidth = stageSize.width / canvasScale;
  const worldViewportHeight = stageSize.height / canvasScale;
  latestInstancesRef.current = instances;
  latestConnectionsRef.current = connections;

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
  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ?? null;
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
      .filter((node): node is React.ElementRef<typeof Group> => Boolean(node));

    if (nodes.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [instances, selectedInstanceIds]);

  React.useEffect(() => {
    const snapshot = createBuilderSnapshot(instances, connections);

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
  }, [connections, instances]);

  function getCurrentSnapshot() {
    return createBuilderSnapshot(
      latestInstancesRef.current,
      latestConnectionsRef.current
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

  function getAsset(assetId: string) {
    return assets.find((asset) => asset.id === assetId) ?? null;
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

  function applySnapshot(snapshot: BuilderSnapshot) {
    isRestoringHistoryRef.current = true;
    setInstances(cloneInstances(snapshot.instances));
    setConnections(cloneConnections(snapshot.connections));
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setSelectedPoint(null);
    setSelectionBox(null);
    dragSelectionRef.current = null;
    transformSelectionRef.current.clear();
    historyTransactionDepthRef.current = 0;
    historyTransactionSnapshotRef.current = null;
  }

  const undoBuilder = React.useCallback(() => {
    setPastSnapshots((current) => {
      const previous = current.at(-1);

      if (!previous) {
        return current;
      }

      setFutureSnapshots((future) => [
        createBuilderSnapshot(instances, connections),
        ...future,
      ].slice(0, 80));
      applySnapshot(previous);
      return current.slice(0, -1);
    });
  }, [connections, instances]);

  const redoBuilder = React.useCallback(() => {
    setFutureSnapshots((current) => {
      const next = current[0];

      if (!next) {
        return current;
      }

      setPastSnapshots((past) => [...past, createBuilderSnapshot(instances, connections)].slice(-80));
      applySnapshot(next);
      return current.slice(1);
    });
  }, [connections, instances]);

  function getPointerInWorld() {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return null;
    }

    return {
      x: pointer.x / canvasScale,
      y: pointer.y / canvasScale,
    };
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
      return;
    }

    setSelectedConnectionId(null);
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
      },
    ]);
    setSelectedInstanceId(id);
    setSelectedInstanceIds([id]);
    setCanvasMessage(`${asset.name} ditambahkan ke canvas dan siap di-drag.`);
  }

  const copySelectedInstances = React.useCallback(() => {
    if (selectedInstances.length === 0) {
      return;
    }

    clipboardRef.current = cloneInstances(selectedInstances);
    setCanvasMessage(`${selectedInstances.length} komponen disalin ke clipboard builder.`);
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
    setCanvasMessage(`${nextInstances.length} komponen ditempel ke canvas.`);
  }, []);

  function handlePointSelect(instanceId: string, pointKey: string) {
    if (!selectedWireTypeId) {
      setCanvasMessage("Pilih wire type dulu sebelum membuat koneksi.");
      return;
    }

    if (
      selectedPoint?.instanceId === instanceId &&
      selectedPoint.pointKey === pointKey
    ) {
      setSelectedPoint(null);
      setCanvasMessage("Connection point dibatalkan.");
      return;
    }

    if (!selectedPoint) {
      setSelectedPoint({ instanceId, pointKey });
      setCanvasMessage("Titik pertama dipilih. Klik titik tujuan untuk menyambungkan wiring.");
      return;
    }

    if (selectedPoint.instanceId === instanceId && selectedPoint.pointKey === pointKey) {
      setSelectedPoint(null);
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
      setCanvasMessage("Koneksi itu sudah ada di canvas.");
      return;
    }

    const connectionId = `builder-connection-${nextIdRef.current}`;
    nextIdRef.current += 1;
    const from = getPoint(selectedPoint.instanceId, selectedPoint.pointKey);
    const to = getPoint(instanceId, pointKey);

    if (!from || !to) {
      setSelectedPoint(null);
      setCanvasMessage("Gagal membuat koneksi karena titik referensi tidak ditemukan.");
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
      },
    ]);
    setSelectedPoint(null);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(connectionId);
    setCanvasMessage("Wiring berhasil dibuat berdasarkan connection point yang dipilih.");
  }

  function straightenSelectedConnection() {
    if (!selectedConnectionId) {
      setCanvasMessage("Pilih kabel dulu untuk merapikannya.");
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
    setCanvasMessage("Kabel terpilih dirapikan ulang.");
  }

  function updateCanvasScale(nextScale: number) {
    setCanvasScale(Math.min(MAX_CANVAS_SCALE, Math.max(MIN_CANVAS_SCALE, nextScale)));
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
    setCanvasMessage(checked ? "Label komponen ditampilkan." : "Label komponen disembunyikan.");
  }

  function resetCanvasView() {
    setCanvasScale(1);
    setCanvasMessage("Zoom canvas direset ke 100%.");
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
    setCanvasMessage("Komponen terpilih dihapus dari canvas.");
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
  }

  function clearCanvas() {
    setInstances([]);
    setConnections([]);
    setSelectedInstanceId(null);
    setSelectedInstanceIds([]);
    setSelectedConnectionId(null);
    setSelectedPoint(null);
    setCanvasMessage("Canvas dibersihkan.");
  }

  function removeSelectedConnection() {
    if (!selectedConnectionId) {
      return;
    }

    setConnections((current) =>
      current.filter((connection) => connection.id !== selectedConnectionId)
    );
    setSelectedConnectionId(null);
    setCanvasMessage("Kabel terpilih dihapus.");
  }

  function updateInstance(
    instanceId: string,
    patch: Partial<Pick<BuilderInstance, "x" | "y" | "rotation" | "scale" | "showLabel">>
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
      setCanvasMessage("Komponen dirapikan sesuai alignment yang dipilih.");
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
      { ...bounds[0] }
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
    setCanvasMessage("Komponen dirapikan sesuai alignment yang dipilih.");
  }

  const handleShortcutDeleteSelection = React.useEffectEvent(() => {
    if (selectedConnectionId) {
      removeSelectedConnection();
      return;
    }

    if (selectedInstanceIds.length > 0) {
      removeSelectedInstances();
    }
  });

  const handleShortcutMoveSelectedInstance = React.useEffectEvent((deltaX: number, deltaY: number) => {
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
        setSelectedInstanceId(null);
        setSelectedInstanceIds([]);
        setSelectedConnectionId(null);
        setCanvasMessage("Seleksi dibersihkan.");
        return;
      }

      if (selectedInstanceIds.length > 0) {
        const step = event.shiftKey ? WIRE_GRID_SIZE * 2 : WIRE_GRID_SIZE;

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          handleShortcutMoveSelectedInstance(-step, 0);
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          handleShortcutMoveSelectedInstance(step, 0);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          handleShortcutMoveSelectedInstance(0, -step);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          handleShortcutMoveSelectedInstance(0, step);
          return;
        }
      }

      if (modifier && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        updateCanvasScale(canvasScale + CANVAS_SCALE_STEP);
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
        updateCanvasScale(canvasScale - CANVAS_SCALE_STEP);
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
        setCanvasMessage("Mode wiring dibatalkan.");
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
    selectedPoint,
    copySelectedInstances,
    pasteCopiedInstances,
    redoBuilder,
    undoBuilder,
    connections,
    instances,
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="min-h-0 overflow-auto border-r border-border/70 bg-background/95 p-4">
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Component Palette</CardTitle>
              <CardDescription>
                Asset aktif dengan connection point siap di-drop ke canvas builder.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
                placeholder="Cari asset, tipe, atau titik koneksi..."
              />
              <select
                value={assetComponentTypeFilter}
                onChange={(event) => setAssetComponentTypeFilter(event.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="all">Semua komponen</option>
                {assetComponentTypes.map((componentType) => (
                  <option key={componentType} value={componentType}>
                    {componentType}
                  </option>
                ))}
              </select>
              <div className="grid gap-3">
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
                    className="rounded-2xl border border-border/70 bg-card p-3 text-left transition hover:border-primary/50 hover:bg-muted/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
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
                          <div className="flex flex-col items-center gap-1 text-[0.65rem] text-muted-foreground">
                            <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={1.8} />
                            <span>No preview</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{asset.name}</div>
                            <div className="text-xs text-muted-foreground">{asset.componentType}</div>
                          </div>
                          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="mt-0.5 shrink-0" />
                        </div>
                        {asset.styleType ? (
                          <div className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                            {asset.styleType}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredAssets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
                    Tidak ada asset yang cocok dengan pencarian.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-h-0 overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,118,110,0.07))] p-4">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
            <BuilderTopbar
              selectedWireTypeId={selectedWireTypeId}
              wireTypes={wireTypes}
              canUndo={pastSnapshots.length > 0}
              canRedo={futureSnapshots.length > 0}
              zoom={canvasScale}
              canAlign={selectedInstanceIds.length > 0}
              canStraightenWire={Boolean(selectedConnectionId)}
              hasSelectedPoint={Boolean(selectedPoint)}
              hasSelection={Boolean(selectedInstanceIds.length > 0 || selectedConnectionId)}
              onWireTypeChange={setSelectedWireTypeId}
              onUndo={undoBuilder}
              onRedo={redoBuilder}
              onAlign={alignSelectedInstance}
              onZoomOut={() => updateCanvasScale(canvasScale - CANVAS_SCALE_STEP)}
              onZoomIn={() => updateCanvasScale(canvasScale + CANVAS_SCALE_STEP)}
              onResetZoom={resetCanvasView}
              onCancelWiring={() => setSelectedPoint(null)}
              onStraightenWire={straightenSelectedConnection}
              onDeleteSelection={() => {
                if (selectedConnectionId) {
                  removeSelectedConnection();
                  return;
                }
                removeSelectedInstances();
              }}
              onClearCanvas={clearCanvas}
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

                      if (!assetId || !bounds) {
                        return;
                      }

                      addInstance(assetId, event.clientX - bounds.left, event.clientY - bounds.top);
                    }}
                  >
                    <Stage
                      ref={stageRef}
                      width={stageSize.width}
                      height={stageSize.height}
                      scaleX={canvasScale}
                      scaleY={canvasScale}
                      onMouseMove={(event) => {
                        const position = event.target.getStage()?.getPointerPosition();
                        setPointerPosition(
                          position
                            ? { x: position.x / canvasScale, y: position.y / canvasScale }
                            : null
                        );

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
                        }
                      }}
                      onMouseDown={(event) => {
                        if (event.target === event.target.getStage()) {
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
                            setSelectedPoint(null);
                          }
                        }
                      }}
                      onMouseUp={() => {
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
                          const intersectingIds = instances
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

                          const nextSelectedIds = additive
                            ? Array.from(new Set([...selectedInstanceIds, ...intersectingIds]))
                            : intersectingIds;

                          setSelectedInstanceIds(nextSelectedIds);
                          setSelectedInstanceId(nextSelectedIds[0] ?? null);

                          if (nextSelectedIds.length > 0) {
                            setSelectedConnectionId(null);
                          }
                        }

                        selectionAdditiveRef.current = false;
                        setSelectionBox(null);
                      }}
                      onWheel={(event) => {
                        event.evt.preventDefault();
                        updateCanvasScale(
                          canvasScale + (event.evt.deltaY < 0 ? CANVAS_SCALE_STEP : -CANVAS_SCALE_STEP)
                        );
                      }}
                    >
                      <Layer>
                        {Array.from(
                          { length: Math.ceil(worldViewportWidth / WIRE_GRID_SIZE) + 1 },
                          (_, index) => index * WIRE_GRID_SIZE
                        ).map((x) => (
                          <Line
                            key={`grid-v-${x}`}
                            points={[x, 0, x, worldViewportHeight]}
                            stroke={GRID_LINE_COLOR}
                            strokeWidth={1}
                            listening={false}
                          />
                        ))}
                        {Array.from(
                          { length: Math.ceil(worldViewportHeight / WIRE_GRID_SIZE) + 1 },
                          (_, index) => index * WIRE_GRID_SIZE
                        ).map((y) => (
                          <Line
                            key={`grid-h-${y}`}
                            points={[0, y, worldViewportWidth, y]}
                            stroke={GRID_LINE_COLOR}
                            strokeWidth={1}
                            listening={false}
                          />
                        ))}
                        {connections.map((connection) => {
                          const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
                          const to = getPoint(connection.toInstanceId, connection.toPointKey);
                          const wireType = wireTypes.find((item) => item.id === connection.wireTypeId);
                          const isSelected = connection.id === selectedConnectionId;

                          if (!from || !to) {
                            return null;
                          }

                          const renderedControlPoints = normalizeConnectionControlPoints(
                            connection.controlPoints,
                            from,
                            to
                          );
                          const pathPoints = [from, ...renderedControlPoints, to];

                          return (
                            <React.Fragment key={connection.id}>
                              <Line
                                points={flattenPathPoints(pathPoints)}
                                stroke={wireType?.hexColor ?? "#334155"}
                                strokeWidth={isSelected ? 5 : 4}
                                lineCap="round"
                                lineJoin="round"
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
                              />
                              {pathPoints.slice(0, -1).map((point, index) => {
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
                                    points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                                    stroke="rgba(15, 23, 42, 0.01)"
                                    strokeWidth={WIRE_HIT_STROKE_WIDTH}
                                    lineCap="round"
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

                                      handleConnectionSegmentInsert(connection.id, index, position);
                                      setSelectedConnectionId(connection.id);
                                      setSelectedInstanceId(null);
                                      setSelectedInstanceIds([]);
                                      setCanvasMessage("Titik belok baru ditambahkan ke kabel.");
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
                              })}
                              {isSelected
                                ? renderedControlPoints.map((controlPoint, index) => (
                                    <Circle
                                      key={`${connection.id}-handle-${index}`}
                                      x={controlPoint.x}
                                      y={controlPoint.y}
                                      radius={WIRE_HANDLE_RADIUS}
                                      fill="#ffffff"
                                      stroke={wireType?.hexColor ?? "#334155"}
                                      strokeWidth={2}
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
                                        setCanvasMessage("Titik belok kabel dihapus.");
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
                              <Circle x={from.x} y={from.y} radius={4} fill={wireType?.hexColor ?? "#334155"} />
                              <Circle x={to.x} y={to.y} radius={4} fill={wireType?.hexColor ?? "#334155"} />
                            </React.Fragment>
                          );
                        })}
                        {selectedPoint && pointerPosition ? (() => {
                          const point = getPoint(selectedPoint.instanceId, selectedPoint.pointKey);

                          if (!point) {
                            return null;
                          }

                          return (
                            <Line
                              points={[point.x, point.y, pointerPosition.x, pointerPosition.y]}
                              stroke="#f97316"
                              strokeWidth={3}
                              dash={[10, 8]}
                              lineCap="round"
                            />
                          );
                        })() : null}
                        {selectionBox ? (() => {
                          const rect = getSelectionRect(selectionBox);

                          if (!rect) {
                            return null;
                          }

                          return (
                            <Rect
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
                        <Transformer
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
                      </Layer>
                    </Stage>
                    {instances.length === 0 ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="max-w-sm rounded-3xl border border-border/70 bg-background/92 px-6 py-5 text-center shadow-sm">
                          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={2} />
                          </div>
                          <div className="font-medium text-foreground">Canvas masih kosong</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Drag asset dari kiri atau klik asset untuk menempatkannya ke builder.
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
                        {selectedInstanceIds.length} komponen terseleksi
                      </div>
                      <div className="text-muted-foreground">
                        Gunakan align, drag, delete, atau toggle label untuk edit massal.
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
                  </>
                ) : selectedConnection ? (
                  <>
                    <div className="font-medium text-foreground">Wire Connection</div>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Wire Type</span>
                      <select
                        value={selectedConnection.wireTypeId}
                        onChange={(event) => updateConnectionWireType(selectedConnection.id, event.target.value)}
                        className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none"
                      >
                        {wireTypes.map((wireType) => (
                          <option key={wireType.id} value={wireType.id}>
                            {wireType.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button variant="outline" size="sm" onClick={straightenSelectedConnection}>
                      Straighten Wire
                    </Button>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    Pilih komponen atau kabel di canvas untuk mengubah propertinya.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Layers</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {[...connections].reverse().map((connection) => {
                  const wireType = wireTypes.find((item) => item.id === connection.wireTypeId);

                  return (
                    <button
                      key={connection.id}
                      type="button"
                      onClick={() => {
                        setSelectedConnectionId(connection.id);
                        setSelectedInstanceId(null);
                        setSelectedInstanceIds([]);
                      }}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selectedConnectionId === connection.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/70 bg-muted/25 hover:bg-muted/40"
                      }`}
                    >
                      <div className="font-medium text-foreground">{wireType?.name ?? "Wire"}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">wiring</div>
                    </button>
                  );
                })}
                {[...instances].reverse().map((instance) => (
                  <button
                    key={instance.id}
                    type="button"
                    onClick={(event) => {
                      selectInstance(
                        instance.id,
                        event.shiftKey || event.ctrlKey || event.metaKey
                      );
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      selectedInstanceIds.includes(instance.id)
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/70 bg-muted/25 hover:bg-muted/40"
                    }`}
                  >
                    <div className="font-medium text-foreground">{instance.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{instance.componentType}</div>
                  </button>
                ))}
                {instances.length === 0 && connections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada layer aktif di builder.
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <div>Delete / Backspace untuk hapus seleksi.</div>
                <div>Arrow Keys untuk geser komponen per grid.</div>
                <div>Shift + Arrow Keys untuk geser lebih jauh.</div>
                <div>Shift/Ctrl/Cmd + Click untuk multi-select komponen.</div>
                <div>Drag mouse di area kosong canvas untuk box select.</div>
                <div>Ctrl/Cmd + C dan Ctrl/Cmd + V untuk copy paste komponen.</div>
                <div>Ctrl/Cmd + Z dan Ctrl/Cmd + Shift + Z / Y untuk undo redo.</div>
                <div>Ctrl/Cmd + +, -, 0 untuk zoom in, out, dan reset.</div>
                <div>S untuk straighten wire, L untuk toggle label, C untuk cancel wiring.</div>
                <div>Esc untuk membersihkan seleksi aktif.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
