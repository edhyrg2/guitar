"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  AiImageIcon,
  CursorPointer01Icon,
  Edit01Icon,
  ElectricPlugsIcon,
  MoveIcon,
  OvalIcon,
  PaintBrush02Icon,
  SquareIcon,
  TextIcon,
  TriangleIcon,
} from "@hugeicons/core-free-icons";

import type { EditorTool } from "@/lib/custom-component-editor-types";
import { useEditorStore } from "@/lib/custom-component-editor-store";
import { cn } from "@/lib/utils";

type ToolButton = {
  label: string;
  tool: EditorTool;
  icon: IconSvgElement;
};

const TOOL_BUTTONS: ToolButton[] = [
  { label: "Select", tool: "select", icon: CursorPointer01Icon },
  { label: "Pan", tool: "pan", icon: MoveIcon },
  { label: "Rectangle", tool: "rectangle", icon: SquareIcon },
  { label: "Triangle", tool: "triangle", icon: TriangleIcon },
  { label: "Ellipse", tool: "ellipse", icon: OvalIcon },
  { label: "Line", tool: "line", icon: Edit01Icon },
  { label: "Text", tool: "text", icon: TextIcon },
  { label: "Draw", tool: "draw", icon: PaintBrush02Icon },
  { label: "Point", tool: "connection-point", icon: ElectricPlugsIcon },
];

type ToolbarProps = {
  onTriggerImageUpload: () => void;
};

export function Toolbar({ onTriggerImageUpload }: ToolbarProps) {
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);

  return (
    <aside className="flex min-h-0 w-[112px] flex-col border-r border-border/70 bg-background/95 p-3 backdrop-blur">
      <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-card/70 p-2.5 shadow-sm">
        <div className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Tools
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {TOOL_BUTTONS.map((item) => (
            <button
              key={item.tool}
              type="button"
              onClick={() => setTool(item.tool)}
              className={cn(
                "flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[0.65rem] font-medium transition",
                tool === item.tool
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent bg-muted/35 text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground"
              )}
              title={item.label}
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={2} />
              <span className="text-center">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onTriggerImageUpload}
            className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border border-transparent bg-muted/35 px-2 py-2 text-[0.65rem] font-medium text-muted-foreground transition hover:border-border hover:bg-muted/55 hover:text-foreground"
            title="Upload image"
          >
            <HugeiconsIcon icon={AiImageIcon} strokeWidth={2} />
            <span className="text-center">Image</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
