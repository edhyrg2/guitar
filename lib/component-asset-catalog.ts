import { STANDARD_COMPONENT_TYPES } from "@/lib/component-type-standards";

export type ComponentAssetCatalogGroup = {
  type: string;
  names: string[];
};

export async function getComponentAssetCatalogGroups(): Promise<
  ComponentAssetCatalogGroup[]
> {
  return STANDARD_COMPONENT_TYPES.map((type) => ({
    type,
    names: [],
  }));
}
