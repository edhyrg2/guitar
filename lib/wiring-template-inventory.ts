export type WiringTemplateInventoryPickup = {
  role?: string;
  name?: string;
};

export type WiringTemplateInventoryPotentiometer = {
  role?: string;
  name?: string;
};

export type WiringTemplateInventory = {
  pickups: WiringTemplateInventoryPickup[];
  potentiometers: WiringTemplateInventoryPotentiometer[];
  switches: string[];
  capacitors: string[];
  resistors: string[];
  outputs: string[];
  mods: string[];
};

const EMPTY_INVENTORY: WiringTemplateInventory = {
  pickups: [],
  potentiometers: [],
  switches: [],
  capacitors: [],
  resistors: [],
  outputs: [],
  mods: [],
};

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parsePickupList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const role = typeof record.role === "string" ? record.role.trim() : "";

      if (!name) {
        return null;
      }

      return {
        name,
        role: role || undefined,
      } satisfies WiringTemplateInventoryPickup;
    })
    .filter((item): item is WiringTemplateInventoryPickup => item !== null);
}

function parsePotentiometerList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const role = typeof record.role === "string" ? record.role.trim() : "";

      if (!name) {
        return null;
      }

      return {
        name,
        role: role || undefined,
      } satisfies WiringTemplateInventoryPotentiometer;
    })
    .filter((item): item is WiringTemplateInventoryPotentiometer => item !== null);
}

function parseInventoryRecord(value: unknown): WiringTemplateInventory | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    pickups: parsePickupList(record.pickups),
    potentiometers: parsePotentiometerList(record.potentiometers),
    switches: parseStringList(record.switches),
    capacitors: parseStringList(record.capacitors),
    resistors: parseStringList(record.resistors),
    outputs: parseStringList(record.outputs),
    mods: parseStringList(record.mods),
  };
}

export function parseWiringTemplateInventory(
  diagramJson: string,
  switchLogicJson: string
): WiringTemplateInventory {
  const diagram = parseJsonRecord(diagramJson);
  const diagramBuilder =
    diagram?.builder && typeof diagram.builder === "object"
      ? (diagram.builder as Record<string, unknown>)
      : null;
  const diagramInventory = parseInventoryRecord(diagramBuilder?.inventory);

  if (diagramInventory) {
    return diagramInventory;
  }

  const switchLogic = parseJsonRecord(switchLogicJson);
  const switchLogicInventory = parseInventoryRecord(switchLogic?.inventory);

  return switchLogicInventory ?? EMPTY_INVENTORY;
}

export function formatWiringTemplateInventorySummary(inventory: WiringTemplateInventory) {
  const parts = [
    ...inventory.pickups.map((item) => (item.role ? `${item.role}: ${item.name}` : item.name ?? "")),
    ...inventory.potentiometers.map((item) =>
      item.role && item.role !== "other" ? `${item.name} (${item.role})` : item.name ?? ""
    ),
    ...inventory.switches,
    ...inventory.capacitors,
    ...inventory.resistors,
    ...inventory.outputs,
    ...inventory.mods,
  ].filter(Boolean);

  return parts.join(", ");
}
