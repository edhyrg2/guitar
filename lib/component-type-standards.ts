export const STANDARD_COMPONENT_TYPES = [
  "Pickup",
  "Switch",
  "Potentiometer",
  "Capacitor",
  "Resistor",
  "Output Jack",
  "Ground Bus",
  "Mod",
  "Wire",
  "Shielding",
  "Other",
] as const;

export type StandardComponentType = (typeof STANDARD_COMPONENT_TYPES)[number];

export function normalizeComponentType(value: string) {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (["pickup", "pickup type", "pickup model"].includes(lower)) return "Pickup";
  if (["switch", "switch type"].includes(lower)) return "Switch";
  if (["pot", "pot type", "potentiometer"].includes(lower)) return "Potentiometer";
  if (["capacitor", "cap"].includes(lower)) return "Capacitor";
  if (["resistor"].includes(lower)) return "Resistor";
  if (["output", "output jack", "jack"].includes(lower)) return "Output Jack";
  if (["ground", "ground bus"].includes(lower)) return "Ground Bus";
  if (["mod", "accessory / mod", "accessory"].includes(lower)) return "Mod";
  if (["wire"].includes(lower)) return "Wire";
  if (["shielding", "shield"].includes(lower)) return "Shielding";

  return trimmed;
}
