export type PickupModelReference = {
  id: string;
  name: string;
};

export type PickupModelRow = {
  id: string;
  pickupBrandId: string;
  pickupTypeId: string;
  pickupBrandName: string;
  pickupTypeName: string;
  name: string;
  slug: string | null;
  positionType: string | null;
  wireCount: string | null;
  magnetType: string | null;
  dcResistance: string | null;
  outputLevel: string | null;
  isActivePickup: boolean;
  colorCodeSchemaId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PickupModelInput = {
  pickupBrandId: string;
  pickupTypeId: string;
  name: string;
  slug: string | null;
  positionType: string | null;
  wireCount: string | null;
  magnetType: string | null;
  dcResistance: string | null;
  outputLevel: string | null;
  isActivePickup: boolean;
  colorCodeSchemaId: string | null;
  description: string | null;
};
