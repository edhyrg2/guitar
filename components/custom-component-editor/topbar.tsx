"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddSquareIcon,
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  DatabaseIcon,
  Download01Icon,
  FloppyDiskIcon,
  Menu01Icon,
  Rocket01Icon,
  Redo02Icon,
  SearchAddIcon,
  SearchMinusIcon,
  Undo02Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type EditorTopbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  canAlign: boolean;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onAlign: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExportPng: () => void;
  onNewCanvas: () => void;
  onSaveDraft: () => void;
  onSaveAsDraft: () => void;
  onImportJson: () => void;
  onExportJson: () => void;
  onPublish: () => void;
  onOpenDrafts: () => void;
  canSaveDraft: boolean;
  canPublish: boolean;
  publishBusy: boolean;
  draftBusy: boolean;
  currentDraftLabel?: string | null;
  statusText?: string | null;
  autosaveEnabled: boolean;
  onToggleAutosave: (checked: boolean) => void;
};

export function EditorTopbar({
  canUndo,
  canRedo,
  canAlign,
  zoom,
  onUndo,
  onRedo,
  onAlign,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExportPng,
  onNewCanvas,
  onSaveDraft,
  onSaveAsDraft,
  onImportJson,
  onExportJson,
  onPublish,
  onOpenDrafts,
  canSaveDraft,
  canPublish,
  publishBusy,
  draftBusy,
  currentDraftLabel,
  statusText,
  autosaveEnabled,
  onToggleAutosave,
}: EditorTopbarProps) {
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
    setTimeout(action, 0);
  }

  return (
    <div className="relative z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            aria-expanded={menuOpen}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((current) => !current);
            }}
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} data-icon="inline-start" />
            Menu
          </button>
          {menuOpen ? (
            <div
              className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-2xl border border-border/70 bg-background p-2 shadow-xl"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onNewCanvas);
                }}
              >
                <HugeiconsIcon icon={AddSquareIcon} strokeWidth={2} data-icon="inline-start" />
                New Component
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onOpenDrafts);
                }}
              >
                <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} data-icon="inline-start" />
                Open
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSaveDraft || draftBusy}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onSaveDraft);
                }}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} data-icon="inline-start" />
                Save
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSaveDraft || draftBusy}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onSaveAsDraft);
                }}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} data-icon="inline-start" />
                Save As
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onImportJson);
                }}
              >
                <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} data-icon="inline-start" />
                Import JSON
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  runMenuAction(onExportJson);
                }}
              >
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
                Export JSON
              </button>
            </div>
          ) : null}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Switch checked={autosaveEnabled} onCheckedChange={onToggleAutosave} />
          Autosave
        </label>
        <Button
          variant="outline"
          size="sm"
          disabled={!canPublish || publishBusy}
          onClick={onPublish}
        >
          <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} data-icon="inline-start" />
          {publishBusy ? "Publishing..." : "Publish"}
        </Button>
        <Button size="sm" onClick={onExportPng}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
          Export PNG
        </Button>
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
        {currentDraftLabel ? (
          <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
            Draft: <span className="font-medium text-foreground">{currentDraftLabel}</span>
          </div>
        ) : null}
        {statusText ? (
          <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
            {statusText}
          </div>
        ) : null}
        <Button variant="secondary" size="sm" disabled={!canUndo} onClick={onUndo}>
          <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} data-icon="inline-start" />
          Undo
        </Button>
        <Button variant="secondary" size="sm" disabled={!canRedo} onClick={onRedo}>
          <HugeiconsIcon icon={Redo02Icon} strokeWidth={2} data-icon="inline-start" />
          Redo
        </Button>
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card px-1 py-1 shadow-sm">
          <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("left")}>
            <HugeiconsIcon icon={AlignLeftIcon} strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canAlign}
            onClick={() => onAlign("center")}
          >
            <HugeiconsIcon icon={AlignHorizontalCenterIcon} strokeWidth={2} />
          </Button>
          <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("right")}>
            <HugeiconsIcon icon={AlignRightIcon} strokeWidth={2} />
          </Button>
          <Button variant="ghost" size="sm" disabled={!canAlign} onClick={() => onAlign("top")}>
            <HugeiconsIcon icon={AlignTopIcon} strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canAlign}
            onClick={() => onAlign("middle")}
          >
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
  );
}
