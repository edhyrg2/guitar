export type ResistorRow = {
  id: string;
  previewUrl: string | null;
  valueOhm: number;
  valueLabel: string;
  wattage: string | null;
  tolerance: string | null;
  description: string | null;
  isActive: boolean;
};

export type ResistorInput = Omit<ResistorRow, "id" | "previewUrl">;
