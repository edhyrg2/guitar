"use client";

import { EditorShell } from "@/components/custom-component-editor/editor-shell";
import type { CustomComponentEditorTarget } from "@/lib/custom-component-publish-target-types";

type CustomComponentContentProps = {
  initialTarget?: CustomComponentEditorTarget | null;
};

export function CustomComponentContent({ initialTarget = null }: CustomComponentContentProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
      <EditorShell initialTarget={initialTarget} />
    </div>
  );
}
