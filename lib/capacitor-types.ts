export type CapacitorRow = {
  id: string;
  previewUrl: string | null;
  valueFarads: number;
  valueLabel: string;
  type: string | null;
  voltageRating: string | null;
  description: string | null;
  isActive: boolean;
};

export type CapacitorInput = Omit<CapacitorRow, "id" | "previewUrl">;
