export const pickupTypeOptions = [
  "Single Coil",
  "Humbucker",
  "P90",
  "Mini Humbucker",
  "Rail Humbucker",
  "Active Humbucker",
  "Piezo",
] as const;

export type PickupTypeOption = (typeof pickupTypeOptions)[number];

export type PickupTypeRow = {
  id: string;
  name: string;
  slug: string | null;
  coilCount: string | null;
  isActive: boolean;
  description: string | null;
};

export type PickupTypeInput = Omit<PickupTypeRow, "id">;
