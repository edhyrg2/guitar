"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Delete02Icon,
  LockIcon,
  Move01Icon,
  ViewOffIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/custom-component-editor-store";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const objects = useEditorStore((state) => state.objects);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectObject = useEditorStore((state) => state.selectObject);
  const moveLayer = useEditorStore((state) => state.moveLayer);
  const toggleLock = useEditorStore((state) => state.toggleLock);
  const toggleVisibility = useEditorStore((state) => state.toggleVisibility);
  const deleteObject = useEditorStore((state) => state.deleteObject);
  const duplicateObject = useEditorStore((state) => state.duplicateObject);

  const visibleLayers = [...objects].reverse();

  return (
    <Card className="rounded-3xl border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Layers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
          Drag layer card untuk mengubah urutan depan-belakang.
        </div>

        <div className="flex max-h-[380px] flex-col gap-2 overflow-auto">
          {visibleLayers.map((layer) => (
            <div
              key={layer.id}
              draggable
              onDragStart={() => setDraggedId(layer.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();

                if (!draggedId || draggedId === layer.id) {
                  return;
                }

                moveLayer(draggedId, layer.id);
                setDraggedId(null);
              }}
              className={cn(
                "rounded-2xl border px-3 py-3 transition",
                selectedIds.includes(layer.id)
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/70 bg-muted/25 hover:bg-muted/40",
                draggedId === layer.id ? "opacity-55" : ""
              )}
            >
              <button
                type="button"
                onClick={(event) =>
                  selectObject(layer.id, event.shiftKey || event.ctrlKey || event.metaKey)
                }
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <HugeiconsIcon icon={Move01Icon} strokeWidth={2} />
                  </div>
                  <div className="font-medium text-foreground">{layer.name}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {layer.type}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {layer.locked ? "Locked" : "Editable"}
                </div>
              </button>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility(layer.id)}
                >
                  <HugeiconsIcon
                    icon={layer.visible ? ViewIcon : ViewOffIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  {layer.visible ? "Hide" : "Show"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleLock(layer.id)}>
                  <HugeiconsIcon icon={LockIcon} strokeWidth={2} data-icon="inline-start" />
                  {layer.locked ? "Unlock" : "Lock"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateObject(layer.id)}
                >
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteObject(layer.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {visibleLayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Belum ada layer. Mulai dengan menambahkan shape, text, draw, atau image.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
