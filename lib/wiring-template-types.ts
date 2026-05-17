export type WiringTemplateReference = {
  id: string;
  name: string;
};

export type WiringTemplateRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
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

export type WiringTemplateInput = Omit<
  WiringTemplateRow,
  | "id"
  | "pickupConfigurationName"
  | "switchTypeName"
  | "createdAt"
  | "updatedAt"
>;
