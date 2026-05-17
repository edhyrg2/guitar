export type WiringTemplateConnectionReference = {
  id: string;
  name: string;
};

export type WiringTemplateConnectionRow = {
  id: string;
  wiringTemplateId: string;
  wiringTemplateName: string;
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

export type WiringTemplateConnectionInput = Omit<
  WiringTemplateConnectionRow,
  "id" | "wiringTemplateName" | "wireTypeName"
>;
