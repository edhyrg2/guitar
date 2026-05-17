export type ComponentConnectionPointReference = {
  id: string;
  name: string;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
};

export type ComponentConnectionPointRow = {
  id: string;
  componentAssetId: string;
  componentAssetName: string;
  pointKey: string;
  label: string;
  pointType: string;
  x: number;
  y: number;
  description: string | null;
};

export type ComponentConnectionPointInput = Omit<
  ComponentConnectionPointRow,
  "id" | "componentAssetName"
>;
