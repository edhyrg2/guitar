import type { EditorDocument } from "@/lib/custom-component-editor-types";

export type CustomComponentDraftRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  documentJson: EditorDocument;
  createdAt: string;
  updatedAt: string;
};
