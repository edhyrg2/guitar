"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PaintBoardIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/custom-component-editor-store";
import {
  getObjectDimensions,
  withAutoSizedTextDimensions,
} from "@/lib/custom-component-editor-utils";
import type {
  CanvasObject,
  ConnectionPoint,
} from "@/lib/custom-component-editor-types";

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function isTransparentColor(value: string) {
  return value === "transparent" || value === "rgba(0,0,0,0)";
}

function updateNumericField(
  object: CanvasObject,
  field: keyof CanvasObject,
  value: string
) {
  const nextValue = Number(value);

  if (Number.isNaN(nextValue)) {
    return null;
  }

  return {
    ...object,
    [field]: nextValue,
  } as CanvasObject;
}

function resizeObject(object: CanvasObject, axis: "width" | "height", rawValue: string) {
  const nextValue = Number(rawValue);

  if (Number.isNaN(nextValue) || nextValue <= 0) {
    return null;
  }

  const clampedValue = Math.max(10, nextValue);

  if (
    object.type === "rectangle" ||
    object.type === "ellipse" ||
    object.type === "image"
  ) {
    return {
      ...object,
      [axis]: clampedValue,
    } as CanvasObject;
  }

  if (object.type === "text") {
    const dimensions = getObjectDimensions(object);
    const currentSize = axis === "width" ? dimensions.width : dimensions.height;
    const ratio = clampedValue / Math.max(currentSize, 1);

    return withAutoSizedTextDimensions({
      ...object,
      fontSize: Math.max(8, object.fontSize * ratio),
    });
  }

  const dimensions = getObjectDimensions(object);
  const currentSize = axis === "width" ? dimensions.width : dimensions.height;
  const ratio = clampedValue / Math.max(currentSize, 1);

  return {
    ...object,
    points: object.points.map((point, index) => {
      const isAxisPoint = axis === "width" ? index % 2 === 0 : index % 2 === 1;
      return isAxisPoint ? point * ratio : point;
    }),
  } as CanvasObject;
}

function toggleTextStyle(
  object: Extract<CanvasObject, { type: "text" }>,
  style: "bold" | "italic"
) {
  const currentStyles = new Set(object.fontStyle.split(" ").filter(Boolean));

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
    ...object,
    fontStyle:
      nextFontStyle === "" ? "normal" : (nextFontStyle as typeof object.fontStyle),
  });
}

export function PropertiesPanel() {
  const [draftState, setDraftState] = React.useState<{
    ownerId: string | null;
    values: Record<string, string>;
  }>({
    ownerId: null,
    values: {},
  });
  const selectedId = useEditorStore((state) => state.selectedId);
  const selectedConnectionPointId = useEditorStore(
    (state) => state.selectedConnectionPointId
  );
  const selectedConnectionPointIds = useEditorStore(
    (state) => state.selectedConnectionPointIds
  );
  const selectedObject = useEditorStore((state) =>
    state.objects.find((object) => object.id === selectedId)
  );
  const selectedConnectionPoint = useEditorStore((state) =>
    state.connectionPoints.find((point) => point.id === selectedConnectionPointId)
  );
  const updateObject = useEditorStore((state) => state.updateObject);
  const replaceObject = useEditorStore((state) => state.replaceObject);
  const updateConnectionPoint = useEditorStore((state) => state.updateConnectionPoint);
  const beginHistoryTransaction = useEditorStore(
    (state) => state.beginHistoryTransaction
  );
  const endHistoryTransaction = useEditorStore((state) => state.endHistoryTransaction);
  const deleteSelectedConnectionPoint = useEditorStore(
    (state) => state.deleteSelectedConnectionPoint
  );
  const hasMixedSelection =
    Boolean(selectedObject) && selectedConnectionPointIds.length > 0;
  const colorHistoryRef = React.useRef<string | null>(null);

  function beginColorHistorySession(key: string) {
    if (colorHistoryRef.current === key) {
      return;
    }

    if (colorHistoryRef.current !== null) {
      endHistoryTransaction();
    }

    colorHistoryRef.current = key;
    beginHistoryTransaction();
  }

  function endColorHistorySession(key: string) {
    if (colorHistoryRef.current !== key) {
      return;
    }

    colorHistoryRef.current = null;
    endHistoryTransaction();
  }

  if (!selectedObject && !selectedConnectionPoint) {
    return (
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pilih object di canvas untuk mengubah warna, ukuran, opacity, rotasi, dan
          properti spesifik object.
        </CardContent>
      </Card>
    );
  }

  if (!selectedObject && selectedConnectionPoint && selectedConnectionPointIds.length === 1) {
    return (
      <ConnectionPointProperties
        connectionPoint={selectedConnectionPoint}
        onUpdate={(patch) =>
          updateConnectionPoint(selectedConnectionPoint.id, patch)
        }
        onDelete={deleteSelectedConnectionPoint}
      />
    );
  }

  if (!selectedObject && selectedConnectionPointIds.length > 1) {
    return (
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />
            Connection Points
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {selectedConnectionPointIds.length} points selected. Gunakan tombol align di
          toolbar untuk merapikan posisi, atau pilih satu point untuk edit detailnya.
        </CardContent>
      </Card>
    );
  }

  const dimensions = getObjectDimensions(selectedObject);

  function getInputValue(key: string, fallback: number) {
    if (draftState.ownerId !== selectedObject.id) {
      return String(fallback);
    }

    return draftState.values[key] ?? String(fallback);
  }

  function setDraftValue(key: string, value: string) {
    setDraftState((current) => ({
      ownerId: selectedObject.id,
      values:
        current.ownerId === selectedObject.id
          ? {
              ...current.values,
              [key]: value,
            }
          : {
              [key]: value,
            },
    }));
  }

  function clearDraftValue(key: string) {
    setDraftState((current) => {
      if (current.ownerId !== selectedObject.id) {
        return current;
      }

      const next = { ...current.values };
      delete next[key];
      return {
        ownerId: selectedObject.id,
        values: next,
      };
    });
  }

  function handleNumericCommit(params: {
    key: string;
    value: string;
    commit: (value: string) => void;
  }) {
    params.commit(params.value);
    clearDraftValue(params.key);
  }

  function onNumericKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    params: {
      key: string;
      value: string;
      commit: (value: string) => void;
    }
  ) {
    if (event.key === "Enter") {
      handleNumericCommit(params);
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      clearDraftValue(params.key);
      event.currentTarget.blur();
    }
  }

  return (
    <Card className="rounded-3xl border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasMixedSelection ? (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {selectedConnectionPointIds.length} connection point juga sedang terseleksi.
            Properties panel saat ini menampilkan object aktif.
          </div>
        ) : null}

        <PropertyRow label="Name">
          <Input
            value={selectedObject.name}
            onChange={(event) =>
              updateObject(selectedObject.id, { name: event.target.value })
            }
          />
        </PropertyRow>

        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="X">
            <Input
              type="number"
              value={getInputValue("x", Math.round(selectedObject.x))}
              onChange={(event) => setDraftValue("x", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "x",
                  value: getInputValue("x", Math.round(selectedObject.x)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "x", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "x",
                  value: getInputValue("x", Math.round(selectedObject.x)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "x", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
          <PropertyRow label="Y">
            <Input
              type="number"
              value={getInputValue("y", Math.round(selectedObject.y))}
              onChange={(event) => setDraftValue("y", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "y",
                  value: getInputValue("y", Math.round(selectedObject.y)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "y", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "y",
                  value: getInputValue("y", Math.round(selectedObject.y)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "y", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="Width">
            <Input
              type="number"
              min="10"
              value={getInputValue("width", Math.round(dimensions.width))}
              onChange={(event) => setDraftValue("width", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "width",
                  value: getInputValue("width", Math.round(dimensions.width)),
                  commit: (value) => {
                    const next = resizeObject(selectedObject, "width", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "width",
                  value: getInputValue("width", Math.round(dimensions.width)),
                  commit: (value) => {
                    const next = resizeObject(selectedObject, "width", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
          <PropertyRow label="Height">
            <Input
              type="number"
              min="10"
              value={getInputValue("height", Math.round(dimensions.height))}
              onChange={(event) => setDraftValue("height", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "height",
                  value: getInputValue("height", Math.round(dimensions.height)),
                  commit: (value) => {
                    const next = resizeObject(selectedObject, "height", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "height",
                  value: getInputValue("height", Math.round(dimensions.height)),
                  commit: (value) => {
                    const next = resizeObject(selectedObject, "height", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="Rotation">
            <Input
              type="number"
              value={getInputValue("rotation", Math.round(selectedObject.rotation))}
              onChange={(event) => setDraftValue("rotation", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "rotation",
                  value: getInputValue("rotation", Math.round(selectedObject.rotation)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "rotation", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "rotation",
                  value: getInputValue("rotation", Math.round(selectedObject.rotation)),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "rotation", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
          <PropertyRow label="Opacity">
            <Input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={getInputValue("opacity", selectedObject.opacity)}
              onChange={(event) => setDraftValue("opacity", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "opacity",
                  value: getInputValue("opacity", selectedObject.opacity),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "opacity", value);
                    if (next) replaceObject(next);
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "opacity",
                  value: getInputValue("opacity", selectedObject.opacity),
                  commit: (value) => {
                    const next = updateNumericField(selectedObject, "opacity", value);
                    if (next) replaceObject(next);
                  },
                })
              }
            />
          </PropertyRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="Fill">
            <div className="flex items-center gap-3">
              <Input
                type="color"
                className="h-9 w-14 shrink-0 px-1"
                disabled={isTransparentColor(selectedObject.fill)}
                value={isTransparentColor(selectedObject.fill) ? "#ffffff" : selectedObject.fill}
                onPointerDown={() => beginColorHistorySession("object-fill")}
                onFocus={() => beginColorHistorySession("object-fill")}
                onBlur={() => endColorHistorySession("object-fill")}
                onChange={(event) =>
                  updateObject(selectedObject.id, { fill: event.target.value })
                }
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={isTransparentColor(selectedObject.fill)}
                  onCheckedChange={(checked) =>
                    updateObject(selectedObject.id, {
                      fill: checked ? "transparent" : "#f59e0b",
                    })
                  }
                />
                No fill
              </label>
            </div>
          </PropertyRow>
          <PropertyRow label="Stroke">
            <Input
              type="color"
              value={selectedObject.stroke === "transparent" ? "#ffffff" : selectedObject.stroke}
              onPointerDown={() => beginColorHistorySession("object-stroke")}
              onFocus={() => beginColorHistorySession("object-stroke")}
              onBlur={() => endColorHistorySession("object-stroke")}
              onChange={(event) =>
                updateObject(selectedObject.id, { stroke: event.target.value })
              }
            />
          </PropertyRow>
        </div>

        <PropertyRow label="Stroke Width">
          <Input
            type="number"
            min="0"
            step="1"
            value={getInputValue("strokeWidth", selectedObject.strokeWidth)}
            onChange={(event) => setDraftValue("strokeWidth", event.target.value)}
            onBlur={() =>
              handleNumericCommit({
                key: "strokeWidth",
                value: getInputValue("strokeWidth", selectedObject.strokeWidth),
                commit: (value) => {
                  const next = updateNumericField(selectedObject, "strokeWidth", value);
                  if (next) replaceObject(next);
                },
              })
            }
            onKeyDown={(event) =>
              onNumericKeyDown(event, {
                key: "strokeWidth",
                value: getInputValue("strokeWidth", selectedObject.strokeWidth),
                commit: (value) => {
                  const next = updateNumericField(selectedObject, "strokeWidth", value);
                  if (next) replaceObject(next);
                },
              })
            }
          />
        </PropertyRow>

        {selectedObject.type === "rectangle" ? (
          <PropertyRow label="Corner Radius">
            <Input
              type="number"
              min="0"
              step="1"
              value={getInputValue("cornerRadius", selectedObject.cornerRadius)}
              onChange={(event) => setDraftValue("cornerRadius", event.target.value)}
              onBlur={() =>
                handleNumericCommit({
                  key: "cornerRadius",
                  value: getInputValue("cornerRadius", selectedObject.cornerRadius),
                  commit: (value) => {
                    const nextValue = Number(value);

                    if (Number.isNaN(nextValue)) {
                      return;
                    }

                    updateObject(selectedObject.id, {
                      cornerRadius: Math.max(0, nextValue),
                    });
                  },
                })
              }
              onKeyDown={(event) =>
                onNumericKeyDown(event, {
                  key: "cornerRadius",
                  value: getInputValue("cornerRadius", selectedObject.cornerRadius),
                  commit: (value) => {
                    const nextValue = Number(value);

                    if (Number.isNaN(nextValue)) {
                      return;
                    }

                    updateObject(selectedObject.id, {
                      cornerRadius: Math.max(0, nextValue),
                    });
                  },
                })
              }
            />
          </PropertyRow>
        ) : null}

        {selectedObject.type === "text" ? (
          <>
            <PropertyRow label="Text">
              <Input
                value={selectedObject.text}
                onChange={(event) =>
                  replaceObject(
                    withAutoSizedTextDimensions({
                      ...selectedObject,
                      text: event.target.value,
                    })
                  )
                }
              />
            </PropertyRow>
            <PropertyRow label="Font Size">
              <Input
                type="number"
                min="8"
                value={getInputValue("fontSize", selectedObject.fontSize)}
                onChange={(event) => setDraftValue("fontSize", event.target.value)}
                onBlur={() =>
                  handleNumericCommit({
                    key: "fontSize",
                    value: getInputValue("fontSize", selectedObject.fontSize),
                    commit: (value) => {
                      const nextValue = Number(value);

                      if (Number.isNaN(nextValue)) {
                        return;
                      }

                      replaceObject(
                        withAutoSizedTextDimensions({
                          ...selectedObject,
                          fontSize: Math.max(8, nextValue),
                        })
                      );
                    },
                  })
                }
                onKeyDown={(event) =>
                  onNumericKeyDown(event, {
                    key: "fontSize",
                    value: getInputValue("fontSize", selectedObject.fontSize),
                    commit: (value) => {
                      const nextValue = Number(value);

                      if (Number.isNaN(nextValue)) {
                        return;
                      }

                      replaceObject(
                        withAutoSizedTextDimensions({
                          ...selectedObject,
                          fontSize: Math.max(8, nextValue),
                        })
                      );
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Text Style">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    (selectedObject.fontStyle ?? "normal").includes("bold")
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    replaceObject(toggleTextStyle(selectedObject, "bold"))
                  }
                >
                  Bold
                </Button>
                <Button
                  type="button"
                  variant={
                    (selectedObject.fontStyle ?? "normal").includes("italic")
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    replaceObject(toggleTextStyle(selectedObject, "italic"))
                  }
                >
                  Italic
                </Button>
              </div>
            </PropertyRow>
            <PropertyRow label="Text Align">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedObject.textAlign === "left" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateObject(selectedObject.id, { textAlign: "left" })
                  }
                >
                  <HugeiconsIcon
                    icon={TextAlignLeftIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Left
                </Button>
                <Button
                  type="button"
                  variant={selectedObject.textAlign === "center" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateObject(selectedObject.id, { textAlign: "center" })
                  }
                >
                  <HugeiconsIcon
                    icon={TextAlignCenterIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Center
                </Button>
                <Button
                  type="button"
                  variant={selectedObject.textAlign === "right" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateObject(selectedObject.id, { textAlign: "right" })
                  }
                >
                  <HugeiconsIcon
                    icon={TextAlignRightIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Right
                </Button>
              </div>
            </PropertyRow>
          </>
        ) : null}

        {selectedObject.type === "image" ? (
          <PropertyRow label="Image Source">
            <Input readOnly value={selectedObject.src.slice(0, 72)} />
          </PropertyRow>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConnectionPointProperties({
  connectionPoint,
  onUpdate,
  onDelete,
}: {
  connectionPoint: ConnectionPoint;
  onUpdate: (patch: Partial<ConnectionPoint>) => void;
  onDelete: () => void;
}) {
  const beginHistoryTransaction = useEditorStore(
    (state) => state.beginHistoryTransaction
  );
  const endHistoryTransaction = useEditorStore((state) => state.endHistoryTransaction);
  const colorHistoryActiveRef = React.useRef(false);

  function beginColorHistorySession() {
    if (colorHistoryActiveRef.current) {
      return;
    }

    colorHistoryActiveRef.current = true;
    beginHistoryTransaction();
  }

  function endColorHistorySession() {
    if (!colorHistoryActiveRef.current) {
      return;
    }

    colorHistoryActiveRef.current = false;
    endHistoryTransaction();
  }

  return (
    <Card className="rounded-3xl border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />
          Connection Point
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PropertyRow label="Key">
          <Input
            value={connectionPoint.key}
            onChange={(event) => onUpdate({ key: event.target.value })}
          />
        </PropertyRow>
        <PropertyRow label="Label">
          <Input
            value={connectionPoint.label}
            onChange={(event) => onUpdate({ label: event.target.value })}
          />
        </PropertyRow>
        <PropertyRow label="Point Type">
          <Input
            value={connectionPoint.pointType}
            onChange={(event) => onUpdate({ pointType: event.target.value })}
          />
        </PropertyRow>
        <PropertyRow label="Color">
          <div className="flex items-center gap-3">
            <Input
              type="color"
              className="h-9 w-14 shrink-0 px-1"
              value={connectionPoint.color}
              onPointerDown={beginColorHistorySession}
              onFocus={beginColorHistorySession}
              onBlur={endColorHistorySession}
              onChange={(event) => onUpdate({ color: event.target.value })}
            />
            <Input
              value={connectionPoint.color}
              onChange={(event) => onUpdate({ color: event.target.value })}
            />
          </div>
        </PropertyRow>
        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="X">
            <Input
              type="number"
              step="0.01"
              value={connectionPoint.x}
              onChange={(event) =>
                onUpdate({ x: Number(event.target.value || 0) })
              }
            />
          </PropertyRow>
          <PropertyRow label="Y">
            <Input
              type="number"
              step="0.01"
              value={connectionPoint.y}
              onChange={(event) =>
                onUpdate({ y: Number(event.target.value || 0) })
              }
            />
          </PropertyRow>
        </div>
        <PropertyRow label="Description">
          <textarea
            value={connectionPoint.description ?? ""}
            onChange={(event) => onUpdate({ description: event.target.value || null })}
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </PropertyRow>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
          Delete Point
        </Button>
      </CardContent>
    </Card>
  );
}
