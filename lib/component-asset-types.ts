export type ComponentAssetRow = {
  id: string;
  ownerType: string | null;
  ownerId: string | null;
  componentType: string;
  name: string;
  slug: string | null;
  svgUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  anchorPointsJson: string | null;
  editorDocumentJson: string | null;
  styleType: string | null;
  isActive: boolean;
};

export type ComponentAssetInput = Omit<ComponentAssetRow, "id">;

export type ComponentAssetSubmitValue = {
  data: ComponentAssetInput;
  imageFile?: File | null;
};
