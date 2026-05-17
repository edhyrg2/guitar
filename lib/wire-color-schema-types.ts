export type WireColorSchemaReference = {
  id: string;
  name: string;
};

export type WireColorSchemaRow = {
  id: string;
  pickupBrandId: string;
  pickupBrandName: string;
  name: string;
  pickupTypeId: string;
  pickupTypeName: string;
  hotColor: string | null;
  groundColor: string | null;
  shieldColor: string | null;
  northStartColor: string | null;
  northFinishColor: string | null;
  southStartColor: string | null;
  southFinishColor: string | null;
  batteryPositiveColor: string | null;
  batteryNegativeColor: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WireColorSchemaInput = {
  pickupBrandId: string;
  name: string;
  pickupTypeId: string;
  hotColor: string | null;
  groundColor: string | null;
  shieldColor: string | null;
  northStartColor: string | null;
  northFinishColor: string | null;
  southStartColor: string | null;
  southFinishColor: string | null;
  batteryPositiveColor: string | null;
  batteryNegativeColor: string | null;
  notes: string | null;
};
