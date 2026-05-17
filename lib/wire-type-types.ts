export type WireTypeRow = {
  id: string;
  name: string;
  color: string | null;
  hexColor: string | null;
  wireFunction: string | null;
  isShielded: boolean;
  isGround: boolean;
  description: string | null;
};

export type WireTypeInput = Omit<WireTypeRow, "id">;
