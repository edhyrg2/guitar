export type SwitchTypeRow = {
  id: string;
  name: string;
  previewUrl: string | null;
  slug: string | null;
  positionCount: number;
  poleCount: number;
  lugCount: number;
  switchCategory: string | null;
  description: string | null;
  svgAssetId: string | null;
  isActive: boolean;
};

export type SwitchTypeInput = Omit<SwitchTypeRow, "id" | "previewUrl">;
