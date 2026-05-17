"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  ElectricPlugsIcon,
  Move01Icon,
  MinusSignIcon,
  PaintBrush02Icon,
  PlusSignIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
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
  onMove,
  onImageReady,
  onTransformEnd,
  onPointSelect,
}: {
  asset: BuilderAssetDefinition;
  instance: BuilderInstance;
  nodeRef: (node: React.ElementRef<typeof Group> | null) => void;
  isSelected: boolean;
  isDeleteMode: boolean;
  selectedPoint: SelectedPoint | null;
  onSelect: (instanceId: string) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  onImageReady: (instanceId: string, renderWidth: number, renderHeight: number) => void;
  onTransformEnd: (
    instanceId: string,
    nextValue: Pick<BuilderInstance, "x" | "y" | "scale" | "rotation">
  ) => void;
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
      onClick={() => onSelect(instance.id)}
      onTap={() => onSelect(instance.id)}
      onDragMove={(event) => {
        onMove(instance.id, snapToGrid(event.target.x()), snapToGrid(event.target.y()));
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
              fill={active ? "#f97316" : "#0f766e"}
              stroke="#ffffff"
              strokeWidth={2 * markerScale}
            />
            <Circle
              radius={(active ? CONNECTION_POINT_ACTIVE_RING_RADIUS : CONNECTION_POINT_RING_RADIUS) * markerScale}
              stroke="#0f766e"
              strokeWidth={markerScale}
              dash={[3 * markerScale, 3 * markerScale]}
            />
          </Group>
        );
      })}
    </Group>
  );
}

export function CustomBuilderContent({
  assets,
  wireTypes,
}: CustomBuilderContentProps) {
  const [instances, setInstances] = React.useState<BuilderInstance[]>([]);
  const [connections, setConnections] = React.useState<BuilderConnection[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = React.useState<SelectedPoint | null>(null);
  const [selectedWireTypeId, setSelectedWireTypeId] = React.useState<string>(
    wireTypes[0]?.id ?? ""
  );
  const [assetQuery, setAssetQuery] = React.useState("");
  const [canvasMessage, setCanvasMessage] = React.useState(
    "Drag asset dari panel kiri ke canvas, lalu klik dua connection point untuk membuat wiring."
  );
  const [stageSize, setStageSize] = React.useState({ width: 960, height: 720 });
  const [canvasScale, setCanvasScale] = React.useState(1);
  const [pointerPosition, setPointerPosition] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const deferredAssetQuery = React.useDeferredValue(assetQuery);
  const stageWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const transformerRef = React.useRef<React.ElementRef<typeof Transformer> | null>(null);
  const nodeRefs = React.useRef(new Map<string, React.ElementRef<typeof Group>>());
  const stageRef = React.useRef<React.ElementRef<typeof Stage> | null>(null);
  const nextIdRef = React.useRef(1);

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

    return haystack.includes(deferredAssetQuery.trim().toLowerCase());
  });

  const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId) ?? null;
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

    if (!selectedInstanceId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = nodeRefs.current.get(selectedInstanceId);

    if (!node) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [instances, selectedInstanceId]);

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
      },
    ]);
    setSelectedInstanceId(id);
    setCanvasMessage(`${asset.name} ditambahkan ke canvas dan siap di-drag.`);
  }

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

  function resetCanvasView() {
    setCanvasScale(1);
    setCanvasMessage("Zoom canvas direset ke 100%.");
  }

  function removeSelectedInstance() {
    if (!selectedInstanceId) {
      return;
    }

    setInstances((current) => current.filter((instance) => instance.id !== selectedInstanceId));
    setConnections((current) =>
      current.filter(
        (connection) =>
          connection.fromInstanceId !== selectedInstanceId &&
          connection.toInstanceId !== selectedInstanceId
      )
    );
    setSelectedPoint((current) =>
      current?.instanceId === selectedInstanceId ? null : current
    );
    setCanvasMessage("Komponen terpilih dihapus dari canvas.");
    setSelectedInstanceId(null);
    setSelectedConnectionId(null);
  }

  function clearCanvas() {
    setInstances([]);
    setConnections([]);
    setSelectedInstanceId(null);
    setSelectedConnectionId(null);
    setSelectedPoint(null);
    setCanvasMessage("Canvas dibersihkan.");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <Card className="xl:min-h-[780px]">
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {asset.componentType} · {asset.connectionPoints.length} points
                      </div>
                    </div>
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="mt-0.5" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-muted-foreground">
                    {asset.connectionPoints.slice(0, 4).map((point) => (
                      <span
                        key={point.pointKey}
                        className="rounded-full bg-muted px-2 py-1"
                      >
                        {point.label}
                      </span>
                    ))}
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

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Canvas Builder</CardTitle>
            <CardDescription>
              Drag komponen di dalam canvas dan hubungkan wiring hanya lewat connection point.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedWireTypeId}
                onChange={(event) => setSelectedWireTypeId(event.target.value)}
                className="h-9 min-w-56 rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                {wireTypes.map((wireType) => (
                  <option key={wireType.id} value={wireType.id}>
                    {wireType.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => setSelectedPoint(null)}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
                Cancel Wiring
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={removeSelectedInstance}
                disabled={!selectedInstance}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                Delete Selected
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Clear Canvas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={straightenSelectedConnection}
                disabled={!selectedConnectionId}
              >
                Straighten Wire
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCanvasScale(canvasScale - CANVAS_SCALE_STEP)}
              >
                <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} data-icon="inline-start" />
                Zoom Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCanvasScale(canvasScale + CANVAS_SCALE_STEP)}
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Zoom In
              </Button>
              <Button variant="outline" size="sm" onClick={resetCanvasView}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                {Math.round(canvasScale * 100)}%
              </Button>
            </div>

            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {canvasMessage}
            </div>

            <div
              ref={stageWrapperRef}
              className="relative min-h-[620px] rounded-3xl border border-border bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.92))]"
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
                      ? {
                          x: position.x / canvasScale,
                          y: position.y / canvasScale,
                        }
                      : null
                  );
                }}
                onMouseDown={(event) => {
                  if (event.target === event.target.getStage()) {
                    setSelectedInstanceId(null);
                    setSelectedConnectionId(null);
                    setSelectedPoint(null);
                  }
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
                    { length: Math.ceil(stageSize.width / WIRE_GRID_SIZE) + 1 },
                    (_, index) => index * WIRE_GRID_SIZE
                  ).map((x) => (
                    <Line
                      key={`grid-v-${x}`}
                      points={[x, 0, x, stageSize.height]}
                      stroke={GRID_LINE_COLOR}
                      strokeWidth={1}
                      listening={false}
                    />
                  ))}
                  {Array.from(
                    { length: Math.ceil(stageSize.height / WIRE_GRID_SIZE) + 1 },
                    (_, index) => index * WIRE_GRID_SIZE
                  ).map((y) => (
                    <Line
                      key={`grid-h-${y}`}
                      points={[0, y, stageSize.width, y]}
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
                          }}
                          onTap={() => {
                            setSelectedConnectionId(connection.id);
                            setSelectedInstanceId(null);
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
                              onClick={() => {
                                setSelectedConnectionId(connection.id);
                                setSelectedInstanceId(null);
                              }}
                              onTap={() => {
                                setSelectedConnectionId(connection.id);
                                setSelectedInstanceId(null);
                              }}
                              onDblClick={(event) => {
                                const stage = event.target.getStage();
                                const position = stage?.getPointerPosition();

                                if (!position) {
                                  return;
                                }

                                handleConnectionSegmentInsert(connection.id, index, position);
                                setSelectedConnectionId(connection.id);
                                setCanvasMessage("Titik belok baru ditambahkan ke kabel.");
                              }}
                              onDragMove={(event) => {
                                const delta = isVertical
                                  ? event.target.x()
                                  : event.target.y();

                                handleConnectionSegmentDrag(
                                  connection.id,
                                  index,
                                  isVertical ? "x" : "y",
                                  delta
                                );
                                event.target.position({ x: 0, y: 0 });
                                setSelectedConnectionId(connection.id);
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
                                onClick={() => {
                                  setSelectedConnectionId(connection.id);
                                  setSelectedInstanceId(null);
                                }}
                                onTap={() => {
                                  setSelectedConnectionId(connection.id);
                                  setSelectedInstanceId(null);
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
                        isSelected={instance.id === selectedInstanceId}
                        isDeleteMode={false}
                        selectedPoint={selectedPoint}
                        onSelect={setSelectedInstanceId}
                        onMove={(instanceId, x, y) => {
                          setInstances((current) => {
                            const nextInstances = current.map((item) =>
                              item.id === instanceId ? { ...item, x, y } : item
                            );

                            setConnections((currentConnections) =>
                              currentConnections.map((connection) =>
                                connection.fromInstanceId === instanceId ||
                                connection.toInstanceId === instanceId
                                  ? normalizeConnectionForInstances(connection, nextInstances)
                                  : connection
                              )
                            );

                            return nextInstances;
                          });
                        }}
                        onImageReady={handleImageReady}
                        onTransformEnd={(instanceId, nextValue) => {
                          setInstances((current) => {
                            const nextInstances = current.map((item) =>
                              item.id === instanceId ? { ...item, ...nextValue } : item
                            );

                            setConnections((currentConnections) =>
                              currentConnections.map((connection) =>
                                connection.fromInstanceId === instanceId ||
                                connection.toInstanceId === instanceId
                                  ? normalizeConnectionForInstances(connection, nextInstances)
                                  : connection
                              )
                            );

                            return nextInstances;
                          });
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
          </CardContent>
        </Card>

        <Card className="xl:min-h-[780px]">
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
            <CardDescription>
              Ringkasan wiring aktif, detail komponen terpilih, dan daftar koneksi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Components</div>
                <div className="mt-1 text-2xl font-medium text-foreground">{instances.length}</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Connections</div>
                <div className="mt-1 text-2xl font-medium text-foreground">{connections.length}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <HugeiconsIcon icon={Move01Icon} strokeWidth={2} />
                Selected Component
              </div>
              {selectedInstance ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="font-medium text-foreground">{selectedInstance.name}</div>
                  <div className="text-muted-foreground">{selectedInstance.componentType}</div>
                  <div className="text-muted-foreground">
                    Position: {Math.round(selectedInstance.x)}, {Math.round(selectedInstance.y)}
                  </div>
                  <div className="text-muted-foreground">
                    Size: {selectedInstance.width} x {selectedInstance.height}
                  </div>
                  <div className="text-muted-foreground">
                    Transform: scale {selectedInstance.scale.toFixed(2)} / rotate{" "}
                    {Math.round(selectedInstance.rotation)}°
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">
                  Klik komponen di canvas untuk melihat detailnya.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <HugeiconsIcon icon={ElectricPlugsIcon} strokeWidth={2} />
                Wiring List
              </div>
              <div className="mt-3 flex max-h-[420px] flex-col gap-3 overflow-auto pr-1">
                {connections.map((connection) => {
                  const wireType = wireTypes.find((item) => item.id === connection.wireTypeId);
                  const from = getPoint(connection.fromInstanceId, connection.fromPointKey);
                  const to = getPoint(connection.toInstanceId, connection.toPointKey);

                  return (
                    <div
                      key={connection.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">
                            {wireType?.name ?? "Wire"}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {from?.label ?? connection.fromPointKey} to{" "}
                            {to?.label ?? connection.toPointKey}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConnections((current) =>
                              current.filter((item) => item.id !== connection.id)
                            );
                          }}
                          className="text-xs text-destructive transition hover:opacity-80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                {connections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada wiring. Pilih dua connection point untuk mulai menyambung.
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
