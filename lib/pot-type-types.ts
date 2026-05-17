export type PotTypeRow = {
  id: string;
  name: string;
  valueOhm: number;
  valueLabel: string;
  taper: string | null;
  potFunction: string | null;
  isPushPull: boolean;
  isPushPush: boolean;
  isNoLoad: boolean;
  shaftType: string | null;
  description: string | null;
  isActive: boolean;
};

export type PotTypeInput = Omit<PotTypeRow, "id">;
