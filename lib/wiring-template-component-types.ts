export type WiringTemplateComponentReference = {
  id: string;
  name: string;
};

export type WiringTemplateComponentRow = {
  id: string;
  wiringTemplateId: string;
  wiringTemplateName: string;
  componentRole: string;
  componentType: string;
  assetId: string;
  assetName: string;
  positionX: number;
  positionY: number;
  rotation: number;
  metadataJson: string | null;
};

export type WiringTemplateComponentInput = Omit<
  WiringTemplateComponentRow,
  "id" | "wiringTemplateName" | "assetName"
>;
