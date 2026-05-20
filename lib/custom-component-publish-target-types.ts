import type { EditorDocument } from "@/lib/custom-component-editor-types";

export type PublishType =
  | "switch-type"
  | "pot-type"
  | "capacitor"
  | "resistor"
  | "pickup-type"
  | "output-jack"
  | "mod";

export type CustomComponentEditorTarget = {
  ownerType: PublishType;
  ownerId: string;
  assetId: string | null;
  assetName: string;
  assetSlug: string;
  styleType: string | null;
  payload: Record<string, unknown>;
  document: EditorDocument;
};
