export type StandardConnectionPointTemplate = {
  pointKey: string;
  label: string;
  pointType: string;
  color: string | null;
  description: string | null;
};

export type ComponentConnectionPointReference = {
  id: string;
  name: string;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
  componentType: string | null;
  slug: string | null;
  standardPins: StandardConnectionPointTemplate[];
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
