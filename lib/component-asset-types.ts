export type ComponentAssetRow = {
  id: string;
  componentType: string;
  name: string;
  slug: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  anchorPointsJson: string | null;
  styleType: string | null;
  isActive: boolean;
};

export type ComponentAssetInput = Omit<ComponentAssetRow, "id">;

export type ComponentAssetSubmitValue = {
  data: ComponentAssetInput;
  svgFile?: File | null;
  thumbnailFile?: File | null;
};
