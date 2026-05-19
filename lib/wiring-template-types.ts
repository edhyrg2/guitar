export type WiringTemplateReference = {
  id: string;
  name: string;
};

export type WiringTemplateDetailComponent = {
  id: string;
  componentRole: string;
  componentType: string;
  assetId: string;
  assetName: string;
  positionX: number;
  positionY: number;
  rotation: number;
  scale: number;
  showLabel: boolean;
  metadataJson: string | null;
};

export type WiringTemplateDetailConnection = {
  id: string;
  fromComponentRole: string;
  fromPointKey: string;
  toComponentRole: string;
  toPointKey: string;
  wireTypeId: string;
  wireTypeName: string;
  wireColor: string | null;
  pathJson: string | null;
  label: string | null;
  notes: string | null;
};

export type WiringTemplateRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  pickupConfigurationId: string;
  pickupConfigurationName: string;
  switchTypeId: string;
  switchTypeName: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string | null;
  diagramJson: string;
  switchLogicJson: string;
  isVerified: boolean;
  sourceType: string | null;
  sourceUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WiringTemplateDetail = WiringTemplateRow & {
  components: WiringTemplateDetailComponent[];
  connections: WiringTemplateDetailConnection[];
};

export type WiringTemplateInput = Omit<
  WiringTemplateRow,
  | "id"
  | "pickupConfigurationName"
  | "switchTypeName"
  | "createdAt"
  | "updatedAt"
>;
