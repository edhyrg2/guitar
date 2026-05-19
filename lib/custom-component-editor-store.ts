"use client";

import { create } from "zustand";

import type {
  CanvasObject,
  ConnectionPoint,
  EditorDocument,
  EditorTool,
  EditorViewport,
} from "@/lib/custom-component-editor-types";
import {
  cloneCanvasObjects,
  createConnectionPoint,
  createEditorId,
  duplicateCanvasObject,
  getObjectBounds,
} from "@/lib/custom-component-editor-utils";

type HistorySnapshot = {
  background: string;
  objects: CanvasObject[];
  connectionPoints: ConnectionPoint[];
  viewport: EditorViewport;
};

type EditorState = {
  background: string;
  objects: CanvasObject[];
  connectionPoints: ConnectionPoint[];
  selectedId: string | null;
  selectedIds: string[];
  selectedConnectionPointId: string | null;
  selectedConnectionPointIds: string[];
  tool: EditorTool;
  viewport: EditorViewport;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  historyTransactionDepth: number;
  historyTransactionSnapshot: HistorySnapshot | null;
  setTool: (tool: EditorTool) => void;
  setViewport: (viewport: Partial<EditorViewport>) => void;
  selectObject: (id: string | null, additive?: boolean) => void;
  selectObjects: (ids: string[], additive?: boolean) => void;
  selectConnectionPoint: (id: string | null, additive?: boolean) => void;
  clearSelection: () => void;
  addObject: (object: CanvasObject) => void;
  addObjects: (objects: CanvasObject[]) => void;
  addConnectionPoint: (point: { x: number; y: number }) => void;
  updateConnectionPoint: (id: string, patch: Partial<ConnectionPoint>) => void;
  deleteConnectionPoint: (id: string) => void;
  deleteSelectedConnectionPoint: () => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  replaceObject: (object: CanvasObject) => void;
  deleteObject: (id: string) => void;
  deleteSelectedObject: () => void;
  duplicateSelectedObject: () => void;
  duplicateObject: (id: string) => void;
  moveSelectedObjects: (deltaX: number, deltaY: number) => void;
  groupSelectedObjects: () => void;
  ungroupSelectedObjects: () => void;
  setSelectedVisibility: (visible: boolean) => void;
  setSelectedLocked: (locked: boolean) => void;
  alignSelectedObjects: (
    mode: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => void;
  moveLayer: (sourceId: string, targetId: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
  undo: () => void;
  redo: () => void;
  importDocument: (document: EditorDocument) => void;
};

const HISTORY_LIMIT = 80;

function createSnapshot(
  state: Pick<EditorState, "background" | "objects" | "connectionPoints" | "viewport">
) {
  return {
    background: state.background,
    objects: cloneCanvasObjects(state.objects),
    connectionPoints: state.connectionPoints.map((point) => ({ ...point })),
    viewport: { ...state.viewport },
  };
}

function pushHistory(state: EditorState) {
  const snapshot = createSnapshot(state);
  const nextPast = [...state.past, snapshot];

  return nextPast.length > HISTORY_LIMIT ? nextPast.slice(-HISTORY_LIMIT) : nextPast;
}

function shouldDeferHistory(state: EditorState) {
  return state.historyTransactionDepth > 0;
}

function withHistory<T extends Record<string, unknown>>(state: EditorState, patch: T) {
  if (shouldDeferHistory(state)) {
    return {
      ...patch,
      past: state.past,
      future: state.future,
    };
  }

  return {
    ...patch,
    past: pushHistory(state),
    future: [],
  };
}

function swapPositions<T>(items: T[], sourceIndex: number, targetIndex: number) {
  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveObjectBy(object: CanvasObject, deltaX: number, deltaY: number): CanvasObject {
  return {
    ...object,
    x: object.x + deltaX,
    y: object.y + deltaY,
  };
}

function combineBounds(
  current: { x: number; y: number; width: number; height: number },
  next: { x: number; y: number; width: number; height: number }
) {
  const minX = Math.min(current.x, next.x);
  const minY = Math.min(current.y, next.y);
  const maxX = Math.max(current.x + current.width, next.x + next.width);
  const maxY = Math.max(current.y + current.height, next.y + next.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function getAlignedDelta(
  mode: "left" | "center" | "right" | "top" | "middle" | "bottom",
  aggregate: { x: number; y: number; width: number; height: number },
  bounds: { x: number; y: number; width: number; height: number }
) {
  let deltaX = 0;
  let deltaY = 0;

  if (mode === "left") {
    deltaX = aggregate.x - bounds.x;
  } else if (mode === "center") {
    deltaX = aggregate.x + aggregate.width / 2 - (bounds.x + bounds.width / 2);
  } else if (mode === "right") {
    deltaX = aggregate.x + aggregate.width - (bounds.x + bounds.width);
  } else if (mode === "top") {
    deltaY = aggregate.y - bounds.y;
  } else if (mode === "middle") {
    deltaY = aggregate.y + aggregate.height / 2 - (bounds.y + bounds.height / 2);
  } else if (mode === "bottom") {
    deltaY = aggregate.y + aggregate.height - (bounds.y + bounds.height);
  }

  return { deltaX, deltaY };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  background: "#f8fafc",
  objects: [],
  connectionPoints: [],
  selectedId: null,
  selectedIds: [],
  selectedConnectionPointId: null,
  selectedConnectionPointIds: [],
  tool: "select",
  viewport: { x: 64, y: 40, scale: 1 },
  past: [],
  future: [],
  historyTransactionDepth: 0,
  historyTransactionSnapshot: null,

  setTool: (tool) => set({ tool }),

  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),

  selectObject: (selectedId, additive = false) =>
    set((state) => {
      if (!selectedId) {
        return {
          selectedId: null,
          selectedIds: [],
          selectedConnectionPointId: null,
          selectedConnectionPointIds: [],
        };
      }

      const targetObject = state.objects.find((object) => object.id === selectedId);
      const relatedIds = targetObject?.groupId
        ? state.objects
            .filter((object) => object.groupId === targetObject.groupId)
            .map((object) => object.id)
        : [selectedId];

      if (!additive) {
        return {
          selectedId: relatedIds[0] ?? null,
          selectedIds: relatedIds,
          selectedConnectionPointId: null,
          selectedConnectionPointIds: [],
        };
      }

      const exists = relatedIds.every((id) => state.selectedIds.includes(id));
      const selectedIds = exists
        ? state.selectedIds.filter((id) => !relatedIds.includes(id))
        : Array.from(new Set([...state.selectedIds, ...relatedIds]));

      return {
        selectedId: selectedIds[0] ?? null,
        selectedIds,
        selectedConnectionPointId: state.selectedConnectionPointId,
        selectedConnectionPointIds: state.selectedConnectionPointIds,
      };
    }),

  selectObjects: (ids, additive = false) =>
    set((state) => ({
      selectedId: ids[0] ?? null,
      selectedIds: ids,
      selectedConnectionPointId: additive ? state.selectedConnectionPointId : null,
      selectedConnectionPointIds: additive ? state.selectedConnectionPointIds : [],
    })),

  selectConnectionPoint: (selectedConnectionPointId, additive = false) =>
    set((state) => {
      if (!selectedConnectionPointId) {
        return {
          selectedConnectionPointId: null,
          selectedConnectionPointIds: [],
          selectedId: null,
          selectedIds: [],
        };
      }

      if (!additive) {
        return {
          selectedConnectionPointId,
          selectedConnectionPointIds: [selectedConnectionPointId],
          selectedId: null,
          selectedIds: [],
        };
      }

      const exists = state.selectedConnectionPointIds.includes(selectedConnectionPointId);
      const selectedConnectionPointIds = exists
        ? state.selectedConnectionPointIds.filter((id) => id !== selectedConnectionPointId)
        : [...state.selectedConnectionPointIds, selectedConnectionPointId];

      return {
        selectedConnectionPointId: selectedConnectionPointIds[0] ?? null,
        selectedConnectionPointIds,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds,
      };
    }),

  clearSelection: () =>
    set({
      selectedId: null,
      selectedIds: [],
      selectedConnectionPointId: null,
      selectedConnectionPointIds: [],
    }),

  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
      connectionPoints: state.connectionPoints,
      selectedId: object.id,
      selectedIds: [object.id],
      selectedConnectionPointId: null,
      selectedConnectionPointIds: [],
      past: pushHistory(state),
      future: [],
    })),

  addObjects: (objects) =>
    set((state) => {
      if (objects.length === 0) {
        return state;
      }

      return {
        objects: [...state.objects, ...objects],
        connectionPoints: state.connectionPoints,
        selectedId: objects[0]?.id ?? null,
        selectedIds: objects.map((object) => object.id),
        selectedConnectionPointId: null,
        selectedConnectionPointIds: [],
        past: pushHistory(state),
        future: [],
      };
    }),

  addConnectionPoint: ({ x, y }) =>
    set((state) => {
      const point = createConnectionPoint({
        x,
        y,
        existingPoints: state.connectionPoints,
      });

      return {
        connectionPoints: [...state.connectionPoints, point],
        selectedConnectionPointId: point.id,
        selectedConnectionPointIds: [point.id],
        selectedId: null,
        selectedIds: [],
        past: pushHistory(state),
        future: [],
      };
    }),

  updateConnectionPoint: (id, patch) =>
    set((state) =>
      withHistory(state, {
        connectionPoints: state.connectionPoints.map((point) =>
          point.id === id ? { ...point, ...patch } : point
        ),
      })
    ),

  deleteConnectionPoint: (id) =>
    set((state) => ({
      connectionPoints: state.connectionPoints.filter((point) => point.id !== id),
      selectedConnectionPointId:
        state.selectedConnectionPointId === id
          ? state.selectedConnectionPointIds.filter((pointId) => pointId !== id)[0] ?? null
          : state.selectedConnectionPointId,
      selectedConnectionPointIds: state.selectedConnectionPointIds.filter(
        (pointId) => pointId !== id
      ),
      past: pushHistory(state),
      future: [],
    })),

  deleteSelectedConnectionPoint: () => {
    const { selectedConnectionPointIds } = get();

    if (selectedConnectionPointIds.length === 0) {
      return;
    }

    set((state) => ({
      connectionPoints: state.connectionPoints.filter(
        (point) => !selectedConnectionPointIds.includes(point.id)
      ),
      selectedConnectionPointId: null,
      selectedConnectionPointIds: [],
      past: pushHistory(state),
      future: [],
    }));
  },

  updateObject: (id, patch) =>
    set((state) =>
      withHistory(state, {
        objects: state.objects.map((object) =>
          object.id === id ? ({ ...object, ...patch } as CanvasObject) : object
        ),
      })
    ),

  replaceObject: (object) =>
    set((state) =>
      withHistory(state, {
        objects: state.objects.map((item) => (item.id === object.id ? object : item)),
        selectedId: object.id,
        selectedIds: state.selectedIds.includes(object.id)
          ? state.selectedIds
          : [object.id],
      })
    ),

  deleteObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((object) => object.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      selectedConnectionPointId: state.selectedConnectionPointId,
      selectedConnectionPointIds: state.selectedConnectionPointIds,
      past: pushHistory(state),
      future: [],
    })),

  deleteSelectedObject: () => {
    const { selectedIds } = get();

    if (selectedIds.length === 0) {
      return;
    }

    set((state) => ({
      objects: state.objects.filter((object) => !selectedIds.includes(object.id)),
      selectedId: null,
      selectedIds: [],
      selectedConnectionPointId: state.selectedConnectionPointId,
      selectedConnectionPointIds: state.selectedConnectionPointIds,
      past: pushHistory(state),
      future: [],
    }));
  },

  duplicateSelectedObject: () =>
    set((state) => {
      const selected = state.objects.filter((object) =>
        state.selectedIds.includes(object.id)
      );

      if (selected.length === 0) {
        return state;
      }

      const duplicates = selected.map((item) => duplicateCanvasObject(item));

      return {
        objects: [...state.objects, ...duplicates],
        connectionPoints: state.connectionPoints,
        selectedId: duplicates[0]?.id ?? null,
        selectedIds: duplicates.map((item) => item.id),
        selectedConnectionPointId: null,
        selectedConnectionPointIds: [],
        past: pushHistory(state),
        future: [],
      };
    }),

  duplicateObject: (id) =>
    set((state) => {
      const selected = state.objects.find((object) => object.id === id);

      if (!selected) {
        return state;
      }

      const duplicate = duplicateCanvasObject(selected);

      return {
        objects: [...state.objects, duplicate],
        connectionPoints: state.connectionPoints,
        selectedId: duplicate.id,
        selectedIds: [duplicate.id],
        selectedConnectionPointId: null,
        selectedConnectionPointIds: [],
        past: pushHistory(state),
        future: [],
      };
    }),

  moveSelectedObjects: (deltaX, deltaY) =>
    set((state) => {
      if (state.selectedIds.length === 0 || (deltaX === 0 && deltaY === 0)) {
        return state;
      }

      return withHistory(state, {
        objects: state.objects.map((object) =>
          state.selectedIds.includes(object.id)
            ? {
                ...object,
                x: object.x + deltaX,
                y: object.y + deltaY,
              }
            : object
        ),
      });
    }),

  groupSelectedObjects: () =>
    set((state) => {
      if (state.selectedIds.length < 2) {
        return state;
      }

      const groupId = createEditorId("group");

      return {
        objects: state.objects.map((object) =>
          state.selectedIds.includes(object.id) ? { ...object, groupId } : object
        ),
        past: pushHistory(state),
        future: [],
      };
    }),

  ungroupSelectedObjects: () =>
    set((state) => {
      if (state.selectedIds.length === 0) {
        return state;
      }

      return {
        objects: state.objects.map((object) =>
          state.selectedIds.includes(object.id) ? { ...object, groupId: undefined } : object
        ),
        past: pushHistory(state),
        future: [],
      };
    }),

  setSelectedVisibility: (visible) =>
    set((state) => {
      if (state.selectedIds.length === 0) {
        return state;
      }

      return {
        objects: state.objects.map((object) =>
          state.selectedIds.includes(object.id) ? { ...object, visible } : object
        ),
        past: pushHistory(state),
        future: [],
      };
    }),

  setSelectedLocked: (locked) =>
    set((state) => {
      if (state.selectedIds.length === 0) {
        return state;
      }

      return {
        objects: state.objects.map((object) =>
          state.selectedIds.includes(object.id) ? { ...object, locked } : object
        ),
        past: pushHistory(state),
        future: [],
      };
    }),

  alignSelectedObjects: (mode) =>
    set((state) => {
      const selectedObjects = state.objects.filter((object) =>
        state.selectedIds.includes(object.id)
      );
      const selectedConnectionPoints = state.connectionPoints.filter((point) =>
        state.selectedConnectionPointIds.includes(point.id)
      );
      const selectedItemCount =
        selectedObjects.length + selectedConnectionPoints.length;

      if (selectedItemCount < 2) {
        return state;
      }

      if (selectedObjects.length > 0 && selectedConnectionPoints.length > 0) {
        const objectUnits = new Map<
          string,
          {
            objectIds: string[];
            bounds: { x: number; y: number; width: number; height: number };
          }
        >();

        for (const object of selectedObjects) {
          const unitKey = object.groupId ?? object.id;
          const nextBounds = getObjectBounds(object);
          const existingUnit = objectUnits.get(unitKey);

          if (!existingUnit) {
            objectUnits.set(unitKey, {
              objectIds: [object.id],
              bounds: nextBounds,
            });
            continue;
          }

          existingUnit.objectIds.push(object.id);
          existingUnit.bounds = combineBounds(existingUnit.bounds, nextBounds);
        }

        const mixedUnits = [
          ...Array.from(objectUnits.values()).map((unit) => ({
            kind: "object" as const,
            bounds: unit.bounds,
            objectIds: unit.objectIds,
          })),
          ...selectedConnectionPoints.map((point) => ({
            kind: "point" as const,
            bounds: {
              x: point.x,
              y: point.y,
              width: 0,
              height: 0,
            },
            pointId: point.id,
          })),
        ];

        if (mixedUnits.length < 2) {
          return state;
        }

        const aggregate = mixedUnits
          .slice(1)
          .reduce(
            (accumulator, entry) => combineBounds(accumulator, entry.bounds),
            mixedUnits[0].bounds
          );

        const alignedObjects = new Map<string, CanvasObject>();
        const alignedConnectionPoints = new Map<string, ConnectionPoint>();

        for (const unit of mixedUnits) {
          const { deltaX, deltaY } = getAlignedDelta(mode, aggregate, unit.bounds);

          if (unit.kind === "object") {
            for (const objectId of unit.objectIds) {
              const targetObject = state.objects.find((object) => object.id === objectId);

              if (targetObject) {
                alignedObjects.set(objectId, moveObjectBy(targetObject, deltaX, deltaY));
              }
            }

            continue;
          }

          const targetPoint = state.connectionPoints.find(
            (point) => point.id === unit.pointId
          );

          if (targetPoint) {
            alignedConnectionPoints.set(unit.pointId, {
              ...targetPoint,
              x: targetPoint.x + deltaX,
              y: targetPoint.y + deltaY,
            });
          }
        }

        return {
          objects: state.objects.map((object) => alignedObjects.get(object.id) ?? object),
          connectionPoints: state.connectionPoints.map(
            (point) => alignedConnectionPoints.get(point.id) ?? point
          ),
          past: pushHistory(state),
          future: [],
        };
      }

      if (selectedObjects.length >= 2) {
        const units = new Map<
          string,
          {
            objectIds: string[];
            bounds: { x: number; y: number; width: number; height: number };
          }
        >();

        for (const object of selectedObjects) {
          const unitKey = object.groupId ?? object.id;
          const nextBounds = getObjectBounds(object);
          const existingUnit = units.get(unitKey);

          if (!existingUnit) {
            units.set(unitKey, {
              objectIds: [object.id],
              bounds: nextBounds,
            });
            continue;
          }

          existingUnit.objectIds.push(object.id);
          existingUnit.bounds = combineBounds(existingUnit.bounds, nextBounds);
        }

        const selectedUnits = Array.from(units.values());

        if (selectedUnits.length < 2) {
          return state;
        }

        const aggregate = selectedUnits
          .slice(1)
          .reduce(
            (accumulator, entry) => combineBounds(accumulator, entry.bounds),
            selectedUnits[0].bounds
          );

        const alignedMap = new Map<string, CanvasObject>();

        for (const { objectIds, bounds } of selectedUnits) {
          const { deltaX, deltaY } = getAlignedDelta(mode, aggregate, bounds);

          for (const objectId of objectIds) {
            const targetObject = state.objects.find((object) => object.id === objectId);

            if (targetObject) {
              alignedMap.set(objectId, moveObjectBy(targetObject, deltaX, deltaY));
            }
          }
        }

        return {
          objects: state.objects.map((object) => alignedMap.get(object.id) ?? object),
          past: pushHistory(state),
          future: [],
        };
      }

      if (selectedConnectionPoints.length < 2) {
        return state;
      }

      const aggregate = selectedConnectionPoints
        .slice(1)
        .reduce(
          (accumulator, point) =>
            combineBounds(accumulator, {
              x: point.x,
              y: point.y,
              width: 0,
              height: 0,
            }),
          {
            x: selectedConnectionPoints[0].x,
            y: selectedConnectionPoints[0].y,
            width: 0,
            height: 0,
          }
        );

      const nextConnectionPoints = state.connectionPoints.map((point) => {
        if (!state.selectedConnectionPointIds.includes(point.id)) {
          return point;
        }

        const { deltaX, deltaY } = getAlignedDelta(mode, aggregate, {
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
        });

        return {
          ...point,
          x: point.x + deltaX,
          y: point.y + deltaY,
        };
      });

      return {
        connectionPoints: nextConnectionPoints,
        past: pushHistory(state),
        future: [],
      };
    }),

  moveLayer: (sourceId, targetId) =>
    set((state) => {
      if (sourceId === targetId) {
        return state;
      }

      const sourceIndex = state.objects.findIndex((object) => object.id === sourceId);
      const targetIndex = state.objects.findIndex((object) => object.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return state;
      }

      return {
        objects: swapPositions(state.objects, sourceIndex, targetIndex),
        past: pushHistory(state),
        future: [],
      };
    }),

  bringForward: (id) =>
    set((state) => {
      const sourceIndex = state.objects.findIndex((object) => object.id === id);

      if (sourceIndex === -1 || sourceIndex === state.objects.length - 1) {
        return state;
      }

      return {
        objects: swapPositions(state.objects, sourceIndex, sourceIndex + 1),
        past: pushHistory(state),
        future: [],
      };
    }),

  sendBackward: (id) =>
    set((state) => {
      const sourceIndex = state.objects.findIndex((object) => object.id === id);

      if (sourceIndex <= 0) {
        return state;
      }

      return {
        objects: swapPositions(state.objects, sourceIndex, sourceIndex - 1),
        past: pushHistory(state),
        future: [],
      };
    }),

  toggleLock: (id) =>
    set((state) =>
      withHistory(state, {
        objects: state.objects.map((object) =>
          object.id === id ? { ...object, locked: !object.locked } : object
        ),
      })
    ),

  toggleVisibility: (id) =>
    set((state) =>
      withHistory(state, {
        objects: state.objects.map((object) =>
          object.id === id ? { ...object, visible: !object.visible } : object
        ),
      })
    ),

  beginHistoryTransaction: () =>
    set((state) => ({
      historyTransactionDepth: state.historyTransactionDepth + 1,
      historyTransactionSnapshot:
        state.historyTransactionDepth === 0
          ? createSnapshot(state)
          : state.historyTransactionSnapshot,
    })),

  endHistoryTransaction: () =>
    set((state) => {
      if (state.historyTransactionDepth === 0) {
        return state;
      }

      const nextDepth = state.historyTransactionDepth - 1;

      if (nextDepth > 0) {
        return {
          historyTransactionDepth: nextDepth,
        };
      }

      const snapshot = state.historyTransactionSnapshot;
      const currentSnapshot = createSnapshot(state);

      if (!snapshot) {
        return {
          historyTransactionDepth: 0,
          historyTransactionSnapshot: null,
        };
      }

      const unchanged =
        JSON.stringify(snapshot) === JSON.stringify(currentSnapshot);

      return {
        historyTransactionDepth: 0,
        historyTransactionSnapshot: null,
        past: unchanged ? state.past : [...state.past, snapshot].slice(-HISTORY_LIMIT),
        future: unchanged ? state.future : [],
      };
    }),

  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);

      if (!previous) {
        return state;
      }

      const current = createSnapshot(state);
      const selectedStillExists = previous.objects.some(
        (object) => object.id === state.selectedId
      );

      return {
        background: previous.background,
        objects: cloneCanvasObjects(previous.objects),
        connectionPoints: previous.connectionPoints.map((point) => ({ ...point })),
        viewport: { ...previous.viewport },
        selectedId: selectedStillExists ? state.selectedId : null,
        selectedIds: selectedStillExists && state.selectedId ? [state.selectedId] : [],
        selectedConnectionPointId: null,
        selectedConnectionPointIds: [],
        historyTransactionDepth: 0,
        historyTransactionSnapshot: null,
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];

      if (!next) {
        return state;
      }

      const current = createSnapshot(state);
      const remainingFuture = state.future.slice(1);
      const selectedStillExists = next.objects.some((object) => object.id === state.selectedId);

      return {
        background: next.background,
        objects: cloneCanvasObjects(next.objects),
        connectionPoints: next.connectionPoints.map((point) => ({ ...point })),
        viewport: { ...next.viewport },
        selectedId: selectedStillExists ? state.selectedId : null,
        selectedIds: selectedStillExists && state.selectedId ? [state.selectedId] : [],
        selectedConnectionPointId: null,
        selectedConnectionPointIds: [],
        historyTransactionDepth: 0,
        historyTransactionSnapshot: null,
        past: [...state.past, current].slice(-HISTORY_LIMIT),
        future: remainingFuture,
      };
    }),

  importDocument: (document) =>
    set((state) => ({
      background: document.background,
      objects: cloneCanvasObjects(document.objects),
      connectionPoints: document.connectionPoints.map((point) => ({ ...point })),
      selectedId: null,
      selectedIds: [],
      selectedConnectionPointId: null,
      selectedConnectionPointIds: [],
      historyTransactionDepth: 0,
      historyTransactionSnapshot: null,
      past: pushHistory(state),
      future: [],
    })),
}));
