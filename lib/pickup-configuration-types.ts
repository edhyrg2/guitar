export type PickupConfigurationRow = {
  id: string;
  code: string;
  name: string;
  pickupCount: number;
  hasNeck: boolean;
  hasMiddle: boolean;
  hasBridge: boolean;
  description: string | null;
};

export type PickupConfigurationInput = Omit<PickupConfigurationRow, "id">;
