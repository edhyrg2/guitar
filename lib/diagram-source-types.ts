export type DiagramSourceReference = {
  id: string;
  name: string;
};

export type DiagramSourceRow = {
  id: string;
  wiringTemplateId: string;
  wiringTemplateName: string;
  sourceName: string;
  sourceBrand: string | null;
  sourceUrl: string | null;
  sourceFileUrl: string | null;
  sourceType: string | null;
  licenseNotes: string | null;
  isOfficial: boolean;
  verifiedAt: string | null;
  notes: string | null;
};

export type DiagramSourceInput = Omit<
  DiagramSourceRow,
  "id" | "wiringTemplateName"
>;
