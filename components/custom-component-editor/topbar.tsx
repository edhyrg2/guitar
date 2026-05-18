"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  DatabaseIcon,
  Download01Icon,
  FloppyDiskIcon,
  Rocket01Icon,
  Redo02Icon,
  SearchAddIcon,
  SearchMinusIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
  onSaveDraft: () => void;
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
  onSaveDraft,
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
        <label className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Switch checked={autosaveEnabled} onCheckedChange={onToggleAutosave} />
          Autosave
        </label>
        <Button
          variant="outline"
          size="sm"
          disabled={!canSaveDraft || draftBusy}
          onClick={onSaveDraft}
        >
          <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} data-icon="inline-start" />
          Save Draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canPublish || publishBusy}
          onClick={onPublish}
        >
          <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} data-icon="inline-start" />
          {publishBusy ? "Publishing..." : "Publish"}
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenDrafts}>
          <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} data-icon="inline-start" />
          Drafts
        </Button>
        <Button size="sm" onClick={onExportPng}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
          Export PNG
        </Button>
      </div>
    </div>
  );
}
