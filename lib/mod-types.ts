export type ModRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  requiresPushPull: boolean;
  requiresMiniToggle: boolean;
  requiresSpecialSwitch: boolean;
  difficultyLevel: string | null;
  isActive: boolean;
};

export type ModInput = Omit<ModRow, "id">;
