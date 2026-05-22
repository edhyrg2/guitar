"use client";

import * as React from "react";
import type Konva from "konva";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Delete02Icon,
  LinkSquare02Icon,
  LockIcon,
  Unlink01Icon,
  ViewOffIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";

import { useEditorStore } from "@/lib/custom-component-editor-store";
import type {
  CanvasObject,
  ConnectionPoint,
  EditorTool,
} from "@/lib/custom-component-editor-types";
import {
  clampZoom,
  createDrawObject,
  createEllipseObject,
  createLineObject,
  createRectangleObject,
  createTextObject,
  createTriangleObject,
  getObjectDimensions,
  isShapeTool,
  withAutoSizedTextDimensions,
} from "@/lib/custom-component-editor-utils";
import { ShapeRenderer } from "@/components/custom-component-editor/shape-renderer";

type DraftShape =
  | {
      tool: "rectangle" | "triangle" | "ellipse" | "line" | "text";
      start: { x: number; y: number };
      current: { x: number; y: number };
      constrainProportions?: boolean;
    }
  | {
      tool: "draw";
      points: number[];
    }
  | null;

type SelectionBox = {
  start: { x: number; y: number };
  current: { x: number; y: number };
} | null;

type ContextMenuState = {
  x: number;
  y: number;
} | null;

type InlineTextEditorState = {
  objectId: string;
  value: string;
  style: React.CSSProperties;
} | null;

const MIN_DRAW_DISTANCE = 8;

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

type CanvasEditorProps = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function CanvasEditor({ stageRef }: CanvasEditorProps) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const transformerRef = React.useRef<Konva.Transformer | null>(null);
  const nodeMapRef = React.useRef(new Map<string, Konva.Group>());
  const dragOriginRef = React.useRef<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const selectionAdditiveRef = React.useRef(false);
  const [stageSize, setStageSize] = React.useState({ width: 960, height: 720 });
  const [draft, setDraft] = React.useState<DraftShape>(null);
  const [selectionBox, setSelectionBox] = React.useState<SelectionBox>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState>(null);
  const [inlineTextEditor, setInlineTextEditor] =
    React.useState<InlineTextEditorState>(null);
  const inlineTextEditorRef = React.useRef<HTMLTextAreaElement | null>(null);

  const background = useEditorStore((state) => state.background);
  const objects = useEditorStore((state) => state.objects);
  const connectionPoints = useEditorStore((state) => state.connectionPoints);
  const selectedId = useEditorStore((state) => state.selectedId);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedConnectionPointIds = useEditorStore(
    (state) => state.selectedConnectionPointIds
  );
  const tool = useEditorStore((state) => state.tool);
  const viewport = useEditorStore((state) => state.viewport);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setTool = useEditorStore((state) => state.setTool);
  const selectObject = useEditorStore((state) => state.selectObject);
  const selectObjects = useEditorStore((state) => state.selectObjects);
  const selectConnectionPoint = useEditorStore((state) => state.selectConnectionPoint);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const addObject = useEditorStore((state) => state.addObject);
  const addConnectionPoint = useEditorStore((state) => state.addConnectionPoint);
  const replaceObject = useEditorStore((state) => state.replaceObject);
  const updateConnectionPoint = useEditorStore((state) => state.updateConnectionPoint);
  const duplicateSelectedObject = useEditorStore((state) => state.duplicateSelectedObject);
  const deleteSelectedObject = useEditorStore((state) => state.deleteSelectedObject);
  const groupSelectedObjects = useEditorStore((state) => state.groupSelectedObjects);
  const ungroupSelectedObjects = useEditorStore((state) => state.ungroupSelectedObjects);
  const setSelectedVisibility = useEditorStore((state) => state.setSelectedVisibility);
  const setSelectedLocked = useEditorStore((state) => state.setSelectedLocked);
  const beginHistoryTransaction = useEditorStore(
    (state) => state.beginHistoryTransaction
  );
  const endHistoryTransaction = useEditorStore((state) => state.endHistoryTransaction);

  const selectedObject = objects.find((object) => object.id === selectedId) ?? null;
  const selectedObjects = objects.filter((object) => selectedIds.includes(object.id));
  const hasGroupedSelection = selectedObjects.some((object) => object.groupId);
  const allSelectedVisible =
    selectedObjects.length > 0 && selectedObjects.every((object) => object.visible);
  const allSelectedLocked =
    selectedObjects.length > 0 && selectedObjects.every((object) => object.locked);

  React.useEffect(() => {
    const element = wrapperRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setStageSize({
        width: Math.max(element.clientWidth, 480),
        height: Math.max(element.clientHeight, 520),
      });
    });

    observer.observe(element);
    setStageSize({
      width: Math.max(element.clientWidth, 480),
      height: Math.max(element.clientHeight, 520),
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer || selectedIds.length === 0) {
      transformer?.nodes([]);
      transformer?.getLayer()?.batchDraw();
      return;
    }

    const selectedNodes = selectedIds
      .map((id) => nodeMapRef.current.get(id))
      .filter((node): node is Konva.Group => Boolean(node));

    if (selectedNodes.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, objects]);

  React.useEffect(() => {
    function handleClose() {
      setContextMenu(null);
    }

    window.addEventListener("click", handleClose);
    window.addEventListener("keydown", handleClose);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("keydown", handleClose);
    };
  }, []);

  React.useEffect(() => {
    if (!inlineTextEditorRef.current) {
      return;
    }

    inlineTextEditorRef.current.focus();
    inlineTextEditorRef.current.select();
  }, [inlineTextEditor]);

  const getPointerInWorld = React.useCallback(() => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!stage || !pointer) {
      return null;
    }

    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  }, [stageRef, viewport]);

  const commitTransform = React.useCallback(
    (object: CanvasObject, node: Konva.Group) => {
      const nextRotation = node.rotation();
      const nextX = node.x();
      const nextY = node.y();
      const nextScaleX = node.scaleX();
      const nextScaleY = node.scaleY();

      if (
        object.type === "rectangle" ||
        object.type === "triangle" ||
        object.type === "ellipse" ||
        object.type === "image"
      ) {
        replaceObject({
          ...object,
          x: nextX,
          y: nextY,
          rotation: nextRotation,
          width: Math.max(10, object.width * nextScaleX),
          height: Math.max(10, object.height * nextScaleY),
          scaleX: 1,
          scaleY: 1,
        });

        node.scaleX(1);
        node.scaleY(1);
        return;
      }

      if (object.type === "text") {
        replaceObject(withAutoSizedTextDimensions({
          ...object,
          x: nextX,
          y: nextY,
          rotation: nextRotation,
          fontSize: Math.max(8, object.fontSize * Math.max(nextScaleX, nextScaleY)),
          scaleX: 1,
          scaleY: 1,
        }));

        node.scaleX(1);
        node.scaleY(1);
        return;
      }

      replaceObject({
        ...object,
        x: nextX,
        y: nextY,
        rotation: nextRotation,
        points: object.points.map((point, index) =>
          index % 2 === 0 ? point * nextScaleX : point * nextScaleY
        ),
        scaleX: 1,
        scaleY: 1,
      });

      node.scaleX(1);
      node.scaleY(1);
    },
    [replaceObject]
  );

  const beginShape = React.useCallback(
    (activeTool: EditorTool) => {
      if (!isShapeTool(activeTool)) {
        return;
      }

      const pointer = getPointerInWorld();

      if (!pointer) {
        return;
      }

      if (activeTool === "draw") {
        setDraft({
          tool: "draw",
          points: [pointer.x, pointer.y],
        });
        return;
      }

      setDraft({
        tool: activeTool,
        start: pointer,
        current: pointer,
        constrainProportions: false,
      });
    },
    [getPointerInWorld]
  );

  const updateDraft = React.useCallback((ctrlKey = false) => {
    const pointer = getPointerInWorld();

    if (!pointer || !draft) {
      return;
    }

    if (draft.tool === "draw") {
      setDraft({
        tool: "draw",
        points: [...draft.points, pointer.x, pointer.y],
      });
      return;
    }

    setDraft({
      ...draft,
      current:
        (draft.tool === "rectangle" ||
          draft.tool === "triangle" ||
          draft.tool === "ellipse") &&
        ctrlKey
          ? getConstrainedPoint(draft.start, pointer)
          : pointer,
      constrainProportions:
        (draft.tool === "rectangle" ||
          draft.tool === "triangle" ||
          draft.tool === "ellipse") &&
        ctrlKey,
    });
  }, [draft, getPointerInWorld]);

  const commitDraft = React.useCallback(() => {
    if (!draft) {
      return;
    }

    let created = false;

    if (draft.tool === "rectangle") {
      const deltaX = Math.abs(draft.current.x - draft.start.x);
      const deltaY = Math.abs(draft.current.y - draft.start.y);

      if (deltaX >= MIN_DRAW_DISTANCE || deltaY >= MIN_DRAW_DISTANCE) {
        addObject(createRectangleObject(draft.start, draft.current));
        created = true;
      }
    }

    if (draft.tool === "triangle") {
      const deltaX = Math.abs(draft.current.x - draft.start.x);
      const deltaY = Math.abs(draft.current.y - draft.start.y);

      if (deltaX >= MIN_DRAW_DISTANCE || deltaY >= MIN_DRAW_DISTANCE) {
        addObject(createTriangleObject(draft.start, draft.current));
        created = true;
      }
    }

    if (draft.tool === "ellipse") {
      const deltaX = Math.abs(draft.current.x - draft.start.x);
      const deltaY = Math.abs(draft.current.y - draft.start.y);

      if (deltaX >= MIN_DRAW_DISTANCE || deltaY >= MIN_DRAW_DISTANCE) {
        addObject(createEllipseObject(draft.start, draft.current));
        created = true;
      }
    }

    if (draft.tool === "line") {
      const deltaX = Math.abs(draft.current.x - draft.start.x);
      const deltaY = Math.abs(draft.current.y - draft.start.y);

      if (deltaX >= MIN_DRAW_DISTANCE || deltaY >= MIN_DRAW_DISTANCE) {
        addObject(createLineObject(draft.start, draft.current));
        created = true;
      }
    }

    if (draft.tool === "text") {
      const deltaX = Math.abs(draft.current.x - draft.start.x);
      const deltaY = Math.abs(draft.current.y - draft.start.y);

      if (deltaX >= MIN_DRAW_DISTANCE || deltaY >= MIN_DRAW_DISTANCE) {
        const x = Math.min(draft.start.x, draft.current.x);
        const y = Math.min(draft.start.y, draft.current.y);
        const width = Math.max(180, deltaX);
        const height = Math.max(56, deltaY);

        addObject(createTextObject({ x, y, width, height }));
        created = true;
      }
    }

    if (draft.tool === "draw") {
      if (draft.points.length >= 6) {
        addObject(createDrawObject(draft.points));
        created = true;
      }
    }

    if (created) {
      setTool("select");
    }

    setDraft(null);
  }, [addObject, draft, setTool]);

  const getSelectionRect = React.useCallback((box: SelectionBox) => {
    if (!box) {
      return null;
    }

    return {
      x: Math.min(box.start.x, box.current.x),
      y: Math.min(box.start.y, box.current.y),
      width: Math.abs(box.current.x - box.start.x),
      height: Math.abs(box.current.y - box.start.y),
    };
  }, []);

  let preview: CanvasObject | null = null;

  function beginInlineTextEdit(objectId: string) {
    const target = objects.find((item) => item.id === objectId);
    const node = nodeMapRef.current.get(objectId);
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
      objectId,
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
    selectObject(objectId);
    setContextMenu(null);
  }

  function commitInlineTextEdit() {
    if (!inlineTextEditor) {
      return;
    }

    const target = objects.find((item) => item.id === inlineTextEditor.objectId);

    if (target?.type === "text") {
      replaceObject(
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

  if (draft && draft.tool !== "draw") {
    if (draft.tool === "rectangle") {
      preview = createRectangleObject(draft.start, draft.current);
    } else if (draft.tool === "triangle") {
      preview = createTriangleObject(draft.start, draft.current);
    } else if (draft.tool === "ellipse") {
      preview = createEllipseObject(draft.start, draft.current);
    } else if (draft.tool === "text") {
      const x = Math.min(draft.start.x, draft.current.x);
      const y = Math.min(draft.start.y, draft.current.y);
      const width = Math.max(180, Math.abs(draft.current.x - draft.start.x));
      const height = Math.max(56, Math.abs(draft.current.y - draft.start.y));

      preview = createTextObject({ x, y, width, height });
    } else {
      preview = createLineObject(draft.start, draft.current);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(241,245,249,0.95))] shadow-[0_30px_80px_rgba(15,23,42,0.10)]"
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={tool === "pan"}
        onDragEnd={(event) => {
          if (tool !== "pan") {
            return;
          }

          setViewport({
            x: event.target.x(),
            y: event.target.y(),
          });
        }}
        onMouseDown={(event) => {
          setContextMenu(null);

          if (tool === "connection-point") {
            const targetName = event.target.name();

            if (targetName.includes("editor-connection-point")) {
              return;
            }

            const pointer = getPointerInWorld();

            if (!pointer) {
              return;
            }

            addConnectionPoint(pointer);
            return;
          }

          if (event.target !== event.target.getStage()) {
            return;
          }

          if (tool === "select") {
            const isAdditive =
              event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey;

            selectionAdditiveRef.current = isAdditive;

            if (!isAdditive) {
              selectConnectionPoint(null);
            }
            const pointer = getPointerInWorld();
            if (!pointer) {
              return;
            }
            setSelectionBox({
              start: pointer,
              current: pointer,
            });
            if (!isAdditive) {
              clearSelection();
            }
            return;
          }

          if (tool === "pan") {
            clearSelection();
            return;
          }

          beginShape(tool);
        }}
        onMouseMove={(event) => {
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
          if (draft) {
            updateDraft(event.evt.ctrlKey);
          }
        }}
        onMouseUp={() => {
          if (selectionBox) {
            const rect = getSelectionRect(selectionBox);
            const additive = selectionAdditiveRef.current;

            if (rect && (rect.width >= MIN_DRAW_DISTANCE || rect.height >= MIN_DRAW_DISTANCE)) {
              const intersectingIds = objects
                .filter((object) => object.visible)
                .map((object) => ({
                  id: object.id,
                  node: nodeMapRef.current.get(object.id),
                }))
                .filter((entry) => entry.node)
                .filter(({ node }) => {
                  const bounds = node!.getClientRect({
                    skipShadow: true,
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

              if (additive) {
                selectObjects(
                  Array.from(new Set([...selectedIds, ...intersectingIds])),
                  true
                );
              } else {
                selectObjects(intersectingIds);
              }
            }

            selectionAdditiveRef.current = false;
            setSelectionBox(null);
            return;
          }

          if (draft) {
            commitDraft();
          }
        }}
        onWheel={(event) => {
          setContextMenu(null);
          event.evt.preventDefault();

          const stage = stageRef.current;
          const pointer = stage?.getPointerPosition();

          if (!stage || !pointer) {
            return;
          }

          const oldScale = viewport.scale;
          const nextScale = clampZoom(oldScale + (event.evt.deltaY < 0 ? 0.1 : -0.1));
          const worldPoint = {
            x: (pointer.x - viewport.x) / oldScale,
            y: (pointer.y - viewport.y) / oldScale,
          };

          setViewport({
            scale: nextScale,
            x: pointer.x - worldPoint.x * nextScale,
            y: pointer.y - worldPoint.y * nextScale,
          });
        }}
        onContextMenu={(event) => {
          event.evt.preventDefault();
          setContextMenu({
            x: event.evt.clientX,
            y: event.evt.clientY,
          });
        }}
      >
        <Layer>
          <Rect
            name="editor-export-hidden"
            x={-6000}
            y={-6000}
            width={12000}
            height={12000}
            fill={background}
            listening={false}
          />

          {Array.from({ length: 220 }, (_, index) => index * 80).map((x) => (
            <Line
              name="editor-export-hidden"
              key={`grid-v-${x}`}
              points={[x, -6000, x, 6000]}
              stroke="rgba(15,23,42,0.07)"
              strokeWidth={x % 400 === 0 ? 1.6 : 1}
              listening={false}
            />
          ))}
          {Array.from({ length: 180 }, (_, index) => index * 80).map((y) => (
            <Line
              name="editor-export-hidden"
              key={`grid-h-${y}`}
              points={[-6000, y, 6000, y]}
              stroke="rgba(15,23,42,0.07)"
              strokeWidth={y % 400 === 0 ? 1.6 : 1}
              listening={false}
            />
          ))}

          {objects.map((object) => (
            <ShapeRenderer
              key={object.id}
              object={object}
              isSelected={selectedIds.includes(object.id)}
              onSelect={selectObject}
              onDoubleClick={beginInlineTextEdit}
              onContextMenu={(id, x, y) => {
                if (!selectedIds.includes(id)) {
                  selectObject(id);
                }
                setContextMenu({ x, y });
              }}
              onDragStart={(id, node) => {
                beginHistoryTransaction();
                dragOriginRef.current = {
                  id,
                  x: node.x(),
                  y: node.y(),
                };
              }}
              onDragMove={(id, node, shiftKey) => {
                const dragOrigin = dragOriginRef.current;

                if (!shiftKey || !dragOrigin || dragOrigin.id !== id) {
                  return;
                }

                const deltaX = node.x() - dragOrigin.x;
                const deltaY = node.y() - dragOrigin.y;

                if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                  node.y(dragOrigin.y);
                  return;
                }

                node.x(dragOrigin.x);
              }}
              onDragEnd={(id, x, y) => {
                dragOriginRef.current = null;
                const target = objects.find((item) => item.id === id);
                if (!target) {
                  endHistoryTransaction();
                  return;
                }
                replaceObject({ ...target, x, y });
                endHistoryTransaction();
              }}
              onTransformEnd={(id, node) => {
                const target = objects.find((item) => item.id === id);
                if (!target) return;
                commitTransform(target, node);
              }}
              registerNode={(id, node) => {
                if (node) {
                  nodeMapRef.current.set(id, node);
                } else {
                  nodeMapRef.current.delete(id);
                }
              }}
            />
          ))}

          {connectionPoints.map((point) => (
            <ConnectionPointNode
              key={point.id}
              point={point}
              isSelected={selectedConnectionPointIds.includes(point.id)}
              onSelect={(id, additive) => selectConnectionPoint(id, additive)}
              onDragStart={beginHistoryTransaction}
              onMove={(id, x, y) => updateConnectionPoint(id, { x, y })}
              onDragEnd={endHistoryTransaction}
            />
          ))}

          {preview ? (
            <ShapeRenderer
              object={preview}
              isSelected={false}
              onSelect={() => {}}
              onDoubleClick={() => {}}
              onContextMenu={() => {}}
              onDragStart={() => {}}
              onDragMove={() => {}}
              onDragEnd={() => {}}
              onTransformEnd={() => {}}
              registerNode={() => {}}
            />
          ) : null}

          {draft?.tool === "draw" ? (
            <Line
              points={draft.points}
              stroke="#ef4444"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.2}
            />
          ) : null}

          {selectionBox ? (() => {
            const rect = getSelectionRect(selectionBox);

            if (!rect) {
              return null;
            }

            return (
              <Rect
                name="editor-export-hidden"
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="rgba(15,118,110,0.10)"
                stroke="#0f766e"
                strokeWidth={1}
                dash={[6, 4]}
              />
            );
          })() : null}

          <Transformer
            name="editor-export-hidden"
            ref={transformerRef}
            onTransformStart={() => {
              beginHistoryTransaction();
            }}
            onTransformEnd={() => {
              endHistoryTransaction();
            }}
            rotateEnabled
            enabledAnchors={[
              "top-center",
              "top-left",
              "top-right",
              "middle-left",
              "middle-right",
              "bottom-center",
              "bottom-left",
              "bottom-right",
            ]}
            borderStroke="#0f766e"
            anchorStroke="#0f766e"
            anchorFill="#ffffff"
            anchorSize={8}
            boundBoxFunc={(_, newBox) => ({
              ...newBox,
              width: Math.max(10, newBox.width),
              height: Math.max(10, newBox.height),
            })}
          />
        </Layer>
      </Stage>

      {objects.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-md rounded-[2rem] border border-border/70 bg-background/92 px-6 py-5 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">Start drawing</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the left toolbar to create a rectangle, triangle, ellipse,
              line, text, free draw, or upload an image. Use the pan tool to
              scroll the canvas and the mouse wheel to zoom.
            </div>
          </div>
        </div>
      ) : null}

      {selectedObject ? (
        <div className="pointer-events-none absolute right-4 bottom-4 rounded-full border border-border/70 bg-background/95 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          {selectedObject.name} • {selectedObject.type} •{" "}
          {Math.round(getObjectDimensions(selectedObject).width)} x{" "}
          {Math.round(getObjectDimensions(selectedObject).height)}
        </div>
      ) : null}

      {contextMenu && selectedIds.length > 0 ? (
        <div
          className="fixed z-50 min-w-44 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
            onClick={() => {
              duplicateSelectedObject();
              setContextMenu(null);
            }}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            Duplicate
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
            onClick={() => {
              setSelectedVisibility(!allSelectedVisible);
              setContextMenu(null);
            }}
          >
            <HugeiconsIcon
              icon={allSelectedVisible ? ViewOffIcon : ViewIcon}
              strokeWidth={2}
            />
            {allSelectedVisible ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
            onClick={() => {
              setSelectedLocked(!allSelectedLocked);
              setContextMenu(null);
            }}
          >
            <HugeiconsIcon icon={LockIcon} strokeWidth={2} />
            {allSelectedLocked ? "Unlock" : "Lock"}
          </button>
          {selectedIds.length > 1 && !hasGroupedSelection ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
              onClick={() => {
                groupSelectedObjects();
                setContextMenu(null);
              }}
            >
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
              Group
            </button>
          ) : null}
          {hasGroupedSelection ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
              onClick={() => {
                ungroupSelectedObjects();
                setContextMenu(null);
              }}
            >
              <HugeiconsIcon icon={Unlink01Icon} strokeWidth={2} />
              Ungroup
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive transition hover:bg-muted hover:text-destructive"
            onClick={() => {
              deleteSelectedObject();
              setContextMenu(null);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete
          </button>
        </div>
      ) : null}
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
    </div>
  );
}

function ConnectionPointNode({
  point,
  isSelected,
  onSelect,
  onDragStart,
  onMove,
  onDragEnd,
}: {
  point: ConnectionPoint;
  isSelected: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <>
      <Circle
        name="editor-export-hidden editor-connection-point"
        x={point.x}
        y={point.y}
        radius={isSelected ? 7 : 6}
        fill={isSelected ? "#f97316" : point.color}
        stroke="#ffffff"
        strokeWidth={2}
        draggable
        onClick={(event) => {
          event.cancelBubble = true;
          onSelect(point.id, event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey);
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onSelect(point.id, false);
        }}
        onDragStart={(event) => {
          event.cancelBubble = true;
          onDragStart();
        }}
        onDragMove={(event) => {
          event.cancelBubble = true;
          onMove(point.id, event.target.x(), event.target.y());
        }}
        onDragEnd={(event) => {
          event.cancelBubble = true;
          onDragEnd();
        }}
      />
      <Circle
        name="editor-export-hidden editor-connection-point"
        x={point.x}
        y={point.y}
        radius={isSelected ? 12 : 10}
        stroke={point.color}
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
      />
    </>
  );
}
