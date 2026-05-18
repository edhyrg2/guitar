import { getCapacitorRows } from "@/lib/capacitor-data";
import { getModRows } from "@/lib/mod-data";
import { getPickupModelRows } from "@/lib/pickup-model-data";
import { getPickupTypeRows } from "@/lib/pickup-type-data";
import { getPotTypeRows } from "@/lib/pot-type-data";
import { getResistorRows } from "@/lib/resistor-data";
import { getSwitchTypeRows } from "@/lib/switch-type-data";

export type ComponentAssetCatalogGroup = {
  type: string;
  names: string[];
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );
}

export async function getComponentAssetCatalogGroups(): Promise<
  ComponentAssetCatalogGroup[]
> {
  const [
    pickupTypes,
    pickupModels,
    switchTypes,
    potTypes,
    capacitors,
    resistors,
    mods,
  ] = await Promise.all([
    getPickupTypeRows(),
    getPickupModelRows(),
    getSwitchTypeRows(),
    getPotTypeRows(),
    getCapacitorRows(),
    getResistorRows(),
    getModRows(),
  ]);

  return [
    {
      type: "Pickup Type",
      names: uniqueSorted(pickupTypes.map((item) => item.name)),
    },
    {
      type: "Pickup Model",
      names: uniqueSorted(pickupModels.map((item) => item.name)),
    },
    {
      type: "Switch Type",
      names: uniqueSorted(switchTypes.map((item) => item.name)),
    },
    {
      type: "Potentiometer",
      names: uniqueSorted(potTypes.map((item) => item.name)),
    },
    {
      type: "Capacitor",
      names: uniqueSorted(
        capacitors.map((item) =>
          [item.valueLabel, item.type].filter(Boolean).join(" ")
        )
      ),
    },
    {
      type: "Resistor",
      names: uniqueSorted(
        resistors.map((item) =>
          [item.valueLabel, item.wattage].filter(Boolean).join(" ")
        )
      ),
    },
    {
      type: "Accessory / Mod",
      names: uniqueSorted(mods.map((item) => item.name)),
    },
  ];
}
