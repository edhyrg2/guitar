import { getPrismaClient } from "@/lib/prisma";
import {
  type WiringTemplateDetail,
  type WiringTemplateDetailComponent,
  type WiringTemplateDetailConnection,
  type WiringTemplateReference,
  type WiringTemplateRow,
} from "@/lib/wiring-template-types";

type PrismaWiringTemplateRecord = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string | null;
  diagramJson: unknown;
  switchLogicJson: unknown;
  isVerified: boolean;
  sourceType: string | null;
  sourceUrl: string | null;
  createdBy: string;
  viewCount: number;
  loveCount: number;
  saveCount: number;
  createdAt: Date;
  updatedAt: Date;
  pickupConfiguration: { name: string };
  switchType: { name: string };
  components?: Array<{
    id: string;
    componentRole: string;
    componentType: string;
    assetId: string;
    pickupModelId: string | null;
    pickupTypeId: string | null;
    switchTypeId: string | null;
    potTypeId: string | null;
    capacitorId: string | null;
    resistorId: string | null;
    modId: string | null;
    outputJackId: string | null;
    positionX: number;
    positionY: number;
    rotation: number;
    scale: number;
    showLabel: boolean;
    metadataJson: unknown;
    asset: {
      name: string;
      svgUrl: string | null;
      thumbnailUrl: string | null;
      width: number | null;
      height: number | null;
      anchorPointsJson: unknown;
      ownerType: string | null;
      ownerId: string | null;
      componentType: string;
      publishedDrafts: Array<{
        user: {
          id: string;
          name: string | null;
          photoUrl: string | null;
        };
      }>;
    };
    pickupModel: {
      name: string;
      positionType: string | null;
      wireCount: string | null;
      magnetType: string | null;
      dcResistance: string | null;
      outputLevel: string | null;
      description: string | null;
      pickupBrand: {
        name: string;
      };
      pickupType: {
        name: string;
      };
    } | null;
    pickupType: {
      name: string;
      coilCount: string | null;
      description: string | null;
    } | null;
    switchType: {
      name: string;
      positionCount: number;
      poleCount: number;
      lugCount: number;
      switchCategory: string | null;
      description: string | null;
    } | null;
    potType: {
      name: string;
      valueLabel: string;
      taper: string | null;
      potFunction: string | null;
      isPushPull: boolean;
      isPushPush: boolean;
      isNoLoad: boolean;
      description: string | null;
    } | null;
    capacitor: {
      valueLabel: string;
      type: string | null;
      voltageRating: string | null;
      description: string | null;
    } | null;
    resistor: {
      valueLabel: string;
      wattage: string | null;
      tolerance: string | null;
      description: string | null;
    } | null;
    mod: {
      name: string;
      difficultyLevel: string | null;
      requiresPushPull: boolean;
      requiresMiniToggle: boolean;
      requiresSpecialSwitch: boolean;
      description: string | null;
    } | null;
    outputJack: {
      name: string;
      jackType: string | null;
      mountingStyle: string | null;
      conductorCount: number | null;
      description: string | null;
    } | null;
  }>;
  connections?: Array<{
    id: string;
    fromComponentRole: string;
    fromPointKey: string;
    toComponentRole: string;
    toPointKey: string;
    wireTypeId: string;
    wireColor: string | null;
    pathJson: unknown;
    label: string | null;
    notes: string | null;
    wireType: { name: string };
  }>;
};

type CreatorDirectoryEntry = {
  id: string;
  name: string;
  photoUrl: string | null;
};

type PickupTypeDetail = {
  name: string;
  coilCount: string | null;
  description: string | null;
};

type PickupModelDetail = {
  name: string;
  positionType: string | null;
  wireCount: string | null;
  magnetType: string | null;
  dcResistance: string | null;
  outputLevel: string | null;
  description: string | null;
  pickupBrand: {
    name: string;
  };
  pickupType: {
    name: string;
  };
};

type SwitchTypeDetail = {
  name: string;
  positionCount: number;
  poleCount: number;
  lugCount: number;
  switchCategory: string | null;
  description: string | null;
};

type PotTypeDetail = {
  name: string;
  valueLabel: string;
  taper: string | null;
  potFunction: string | null;
  isPushPull: boolean;
  isPushPush: boolean;
  isNoLoad: boolean;
  description: string | null;
};

type CapacitorDetail = {
  valueLabel: string;
  type: string | null;
  voltageRating: string | null;
  description: string | null;
};

type ResistorDetail = {
  valueLabel: string;
  wattage: string | null;
  tolerance: string | null;
  description: string | null;
};

type ModDetail = {
  name: string;
  difficultyLevel: string | null;
  requiresPushPull: boolean;
  requiresMiniToggle: boolean;
  requiresSpecialSwitch: boolean;
  description: string | null;
};

type OutputJackDetail = {
  name: string;
  jackType: string | null;
  mountingStyle: string | null;
  conductorCount: number | null;
  description: string | null;
};

type WiringTemplateComponentDetailLookup = {
  pickupModels: Map<string, PickupModelDetail>;
  pickupTypes: Map<string, PickupTypeDetail>;
  switchTypes: Map<string, SwitchTypeDetail>;
  potTypes: Map<string, PotTypeDetail>;
  capacitors: Map<string, CapacitorDetail>;
  resistors: Map<string, ResistorDetail>;
  mods: Map<string, ModDetail>;
  outputJacks: Map<string, OutputJackDetail>;
};

type WiringTemplateComponentSpec = {
  label: string;
  value: string;
};

function pushSpec(
  specs: WiringTemplateComponentSpec[],
  label: string,
  value: string | number | null | undefined | boolean
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  if (typeof value === "boolean") {
    if (!value) {
      return;
    }

    specs.push({ label, value: "Yes" });
    return;
  }

  specs.push({ label, value: String(value) });
}

async function loadWiringTemplateComponentDetailLookup(
  prisma: NonNullable<Awaited<ReturnType<typeof getPrismaClient>>>,
  components: NonNullable<PrismaWiringTemplateRecord["components"]>
): Promise<WiringTemplateComponentDetailLookup> {
  const pickupModelIds = new Set<string>();
  const pickupTypeIds = new Set<string>();
  const switchTypeIds = new Set<string>();
  const potTypeIds = new Set<string>();
  const capacitorIds = new Set<string>();
  const resistorIds = new Set<string>();
  const modIds = new Set<string>();
  const outputJackIds = new Set<string>();

  for (const component of components) {
    if (component.pickupModelId) pickupModelIds.add(component.pickupModelId);
    if (component.pickupTypeId) pickupTypeIds.add(component.pickupTypeId);
    if (component.switchTypeId) switchTypeIds.add(component.switchTypeId);
    if (component.potTypeId) potTypeIds.add(component.potTypeId);
    if (component.capacitorId) capacitorIds.add(component.capacitorId);
    if (component.resistorId) resistorIds.add(component.resistorId);
    if (component.modId) modIds.add(component.modId);
    if (component.outputJackId) outputJackIds.add(component.outputJackId);

    if (!component.asset.ownerType || !component.asset.ownerId) {
      continue;
    }

    if (component.asset.ownerType === "pickup-model") {
      pickupModelIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "pickup-type") {
      pickupTypeIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "switch-type") {
      switchTypeIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "pot-type") {
      potTypeIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "capacitor") {
      capacitorIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "resistor") {
      resistorIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "mod") {
      modIds.add(component.asset.ownerId);
    } else if (component.asset.ownerType === "output-jack") {
      outputJackIds.add(component.asset.ownerId);
    }
  }

  const [
    pickupModels,
    pickupTypes,
    switchTypes,
    potTypes,
    capacitors,
    resistors,
    mods,
    outputJacks,
  ] = await Promise.all([
    pickupModelIds.size > 0
      ? prisma.pickupModel.findMany({
          where: { id: { in: Array.from(pickupModelIds) } },
          select: {
            id: true,
            name: true,
            positionType: true,
            wireCount: true,
            magnetType: true,
            dcResistance: true,
            outputLevel: true,
            description: true,
            pickupBrand: {
              select: {
                name: true,
              },
            },
            pickupType: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    pickupTypeIds.size > 0
      ? prisma.pickupType.findMany({
          where: { id: { in: Array.from(pickupTypeIds) } },
          select: { id: true, name: true, coilCount: true, description: true },
        })
      : Promise.resolve([]),
    switchTypeIds.size > 0
      ? prisma.switchType.findMany({
          where: { id: { in: Array.from(switchTypeIds) } },
          select: {
            id: true,
            name: true,
            positionCount: true,
            poleCount: true,
            lugCount: true,
            switchCategory: true,
            description: true,
          },
        })
      : Promise.resolve([]),
    potTypeIds.size > 0
      ? prisma.potType.findMany({
          where: { id: { in: Array.from(potTypeIds) } },
          select: {
            id: true,
            name: true,
            valueLabel: true,
            taper: true,
            potFunction: true,
            isPushPull: true,
            isPushPush: true,
            isNoLoad: true,
            description: true,
          },
        })
      : Promise.resolve([]),
    capacitorIds.size > 0
      ? prisma.capacitor.findMany({
          where: { id: { in: Array.from(capacitorIds) } },
          select: {
            id: true,
            valueLabel: true,
            type: true,
            voltageRating: true,
            description: true,
          },
        })
      : Promise.resolve([]),
    resistorIds.size > 0
      ? prisma.resistor.findMany({
          where: { id: { in: Array.from(resistorIds) } },
          select: {
            id: true,
            valueLabel: true,
            wattage: true,
            tolerance: true,
            description: true,
          },
        })
      : Promise.resolve([]),
    modIds.size > 0
      ? prisma.mod.findMany({
          where: { id: { in: Array.from(modIds) } },
          select: {
            id: true,
            name: true,
            difficultyLevel: true,
            requiresPushPull: true,
            requiresMiniToggle: true,
            requiresSpecialSwitch: true,
            description: true,
          },
        })
      : Promise.resolve([]),
    outputJackIds.size > 0
      ? prisma.outputJack.findMany({
          where: { id: { in: Array.from(outputJackIds) } },
          select: {
            id: true,
            name: true,
            jackType: true,
            mountingStyle: true,
            conductorCount: true,
            description: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    pickupModels: new Map(pickupModels.map((item) => [item.id, item])),
    pickupTypes: new Map(pickupTypes.map((item) => [item.id, item])),
    switchTypes: new Map(switchTypes.map((item) => [item.id, item])),
    potTypes: new Map(potTypes.map((item) => [item.id, item])),
    capacitors: new Map(capacitors.map((item) => [item.id, item])),
    resistors: new Map(resistors.map((item) => [item.id, item])),
    mods: new Map(mods.map((item) => [item.id, item])),
    outputJacks: new Map(outputJacks.map((item) => [item.id, item])),
  };
}

function buildComponentDetail(
  component: NonNullable<PrismaWiringTemplateRecord["components"]>[number],
  lookup: WiringTemplateComponentDetailLookup
) {
  const pickupModel =
    component.pickupModel ??
    (component.pickupModelId ? lookup.pickupModels.get(component.pickupModelId) : null) ??
    (component.asset.ownerType === "pickup-model" && component.asset.ownerId
      ? lookup.pickupModels.get(component.asset.ownerId) ?? null
      : null);
  const pickupType =
    component.pickupType ??
    (component.pickupTypeId ? lookup.pickupTypes.get(component.pickupTypeId) : null) ??
    (component.asset.ownerType === "pickup-type" && component.asset.ownerId
      ? lookup.pickupTypes.get(component.asset.ownerId) ?? null
      : null);
  const switchType =
    component.switchType ??
    (component.switchTypeId ? lookup.switchTypes.get(component.switchTypeId) : null) ??
    (component.asset.ownerType === "switch-type" && component.asset.ownerId
      ? lookup.switchTypes.get(component.asset.ownerId) ?? null
      : null);
  const potType =
    component.potType ??
    (component.potTypeId ? lookup.potTypes.get(component.potTypeId) : null) ??
    (component.asset.ownerType === "pot-type" && component.asset.ownerId
      ? lookup.potTypes.get(component.asset.ownerId) ?? null
      : null);
  const capacitor =
    component.capacitor ??
    (component.capacitorId ? lookup.capacitors.get(component.capacitorId) : null) ??
    (component.asset.ownerType === "capacitor" && component.asset.ownerId
      ? lookup.capacitors.get(component.asset.ownerId) ?? null
      : null);
  const resistor =
    component.resistor ??
    (component.resistorId ? lookup.resistors.get(component.resistorId) : null) ??
    (component.asset.ownerType === "resistor" && component.asset.ownerId
      ? lookup.resistors.get(component.asset.ownerId) ?? null
      : null);
  const mod =
    component.mod ??
    (component.modId ? lookup.mods.get(component.modId) : null) ??
    (component.asset.ownerType === "mod" && component.asset.ownerId
      ? lookup.mods.get(component.asset.ownerId) ?? null
      : null);
  const outputJack =
    component.outputJack ??
    (component.outputJackId ? lookup.outputJacks.get(component.outputJackId) : null) ??
    (component.asset.ownerType === "output-jack" && component.asset.ownerId
      ? lookup.outputJacks.get(component.asset.ownerId) ?? null
      : null);

  if (pickupModel) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Brand", pickupModel.pickupBrand.name);
    pushSpec(specs, "Type", pickupModel.pickupType.name);
    pushSpec(specs, "Position", pickupModel.positionType);
    pushSpec(specs, "Wire Count", pickupModel.wireCount);
    pushSpec(specs, "Magnet", pickupModel.magnetType);
    pushSpec(specs, "DC Resistance", pickupModel.dcResistance);
    pushSpec(specs, "Output", pickupModel.outputLevel);

    return {
      detailTitle: pickupModel.name,
      detailSubtitle: `${pickupModel.pickupBrand.name} • ${pickupModel.pickupType.name}`,
      detailDescription: pickupModel.description,
      detailSpecs: specs,
    };
  }

  if (pickupType) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Coil Count", pickupType.coilCount);

    return {
      detailTitle: pickupType.name,
      detailSubtitle: "Pickup Type",
      detailDescription: pickupType.description,
      detailSpecs: specs,
    };
  }

  if (switchType) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Positions", switchType.positionCount);
    pushSpec(specs, "Poles", switchType.poleCount);
    pushSpec(specs, "Lugs", switchType.lugCount);
    pushSpec(specs, "Category", switchType.switchCategory);

    return {
      detailTitle: switchType.name,
      detailSubtitle: "Switch Type",
      detailDescription: switchType.description,
      detailSpecs: specs,
    };
  }

  if (potType) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Value", potType.valueLabel);
    pushSpec(specs, "Taper", potType.taper);
    pushSpec(specs, "Function", potType.potFunction);
    pushSpec(specs, "Push Pull", potType.isPushPull);
    pushSpec(specs, "Push Push", potType.isPushPush);
    pushSpec(specs, "No Load", potType.isNoLoad);

    return {
      detailTitle: potType.name,
      detailSubtitle: "Potentiometer",
      detailDescription: potType.description,
      detailSpecs: specs,
    };
  }

  if (capacitor) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Value", capacitor.valueLabel);
    pushSpec(specs, "Type", capacitor.type);
    pushSpec(specs, "Voltage", capacitor.voltageRating);

    return {
      detailTitle: capacitor.valueLabel,
      detailSubtitle: "Capacitor",
      detailDescription: capacitor.description,
      detailSpecs: specs,
    };
  }

  if (resistor) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Value", resistor.valueLabel);
    pushSpec(specs, "Wattage", resistor.wattage);
    pushSpec(specs, "Tolerance", resistor.tolerance);

    return {
      detailTitle: resistor.valueLabel,
      detailSubtitle: "Resistor",
      detailDescription: resistor.description,
      detailSpecs: specs,
    };
  }

  if (mod) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Difficulty", mod.difficultyLevel);
    pushSpec(specs, "Needs Push Pull", mod.requiresPushPull);
    pushSpec(specs, "Needs Mini Toggle", mod.requiresMiniToggle);
    pushSpec(specs, "Needs Special Switch", mod.requiresSpecialSwitch);

    return {
      detailTitle: mod.name,
      detailSubtitle: "Accessory / Mod",
      detailDescription: mod.description,
      detailSpecs: specs,
    };
  }

  if (outputJack) {
    const specs: WiringTemplateComponentSpec[] = [];
    pushSpec(specs, "Jack Type", outputJack.jackType);
    pushSpec(specs, "Mounting", outputJack.mountingStyle);
    pushSpec(specs, "Conductors", outputJack.conductorCount);

    return {
      detailTitle: outputJack.name,
      detailSubtitle: "Output Jack",
      detailDescription: outputJack.description,
      detailSpecs: specs,
    };
  }

  return {
    detailTitle: component.asset.name,
    detailSubtitle: component.asset.componentType,
    detailDescription: null,
    detailSpecs: [] as WiringTemplateComponentSpec[],
  };
}

export const seedWiringTemplateRows: WiringTemplateRow[] = [
  {
    id: "seed-wiring-template-strat-sss",
    name: "Strat Standard SSS 5-Way",
    slug: "strat-standard-sss-5-way",
    description: "Classic strat layout with master volume and two tone controls.",
    thumbnailUrl: null,
    pickupConfigurationId: "seed-sss",
    pickupConfigurationName: "Three Single Coil",
    switchTypeId: "seed-5-way-blade",
    switchTypeName: "5-Way Blade Switch",
    volumeCount: 1,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson:
      '{"components":[{"id":"switch","type":"switch","ref":"5-way-blade-switch"},{"id":"volume","type":"pot","role":"volume"}],"wires":[{"from":"neck.hot","to":"switch.lug1","color":"white"},{"from":"volume.output","to":"jack.tip","color":"white"}]}',
    switchLogicJson:
      '{"positions":[{"index":1,"label":"Bridge"},{"index":2,"label":"Bridge + Middle"},{"index":3,"label":"Middle"},{"index":4,"label":"Middle + Neck"},{"index":5,"label":"Neck"}]}',
    isVerified: true,
    sourceType: "Reference",
    sourceUrl: "https://example.com/strat-standard-sss-5-way",
    createdBy: "System Seed",
    creatorId: null,
    creatorName: "System Seed",
    creatorPhoto: null,
    viewCount: 12500,
    loveCount: 176,
    saveCount: 94,
    currentUserLoved: false,
    currentUserSaved: false,
    createdAt: new Date("2026-05-17T13:10:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-17T13:10:00.000Z").toISOString(),
  },
  {
    id: "seed-wiring-template-les-paul-hh",
    name: "Les Paul HH 3-Way",
    slug: "les-paul-hh-3-way",
    description: "Traditional dual-humbucker wiring with two volume and two tone controls.",
    thumbnailUrl: null,
    pickupConfigurationId: "seed-hh",
    pickupConfigurationName: "Dual Humbucker",
    switchTypeId: "seed-3-way-toggle",
    switchTypeName: "3-Way Toggle Switch",
    volumeCount: 2,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson:
      '{"components":[{"id":"toggle","type":"switch","ref":"3-way-toggle-switch"},{"id":"neck-volume","type":"pot","role":"volume"}],"wires":[{"from":"neck.hot","to":"toggle.neck","color":"white"},{"from":"bridge.hot","to":"toggle.bridge","color":"white"}]}',
    switchLogicJson:
      '{"positions":[{"index":1,"label":"Neck"},{"index":2,"label":"Neck + Bridge"},{"index":3,"label":"Bridge"}]}',
    isVerified: false,
    sourceType: "Imported",
    sourceUrl: "https://example.com/les-paul-hh-3-way",
    createdBy: "System Seed",
    creatorId: null,
    creatorName: "System Seed",
    creatorPhoto: null,
    viewCount: 8400,
    loveCount: 124,
    saveCount: 61,
    currentUserLoved: false,
    currentUserSaved: false,
    createdAt: new Date("2026-05-17T13:12:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-17T13:12:00.000Z").toISOString(),
  },
];

export const seedWiringTemplatePickupConfigurationOptions: WiringTemplateReference[] = [
  { id: "seed-sss", name: "Three Single Coil" },
  { id: "seed-hh", name: "Dual Humbucker" },
  { id: "seed-hsh", name: "Humbucker Single Humbucker" },
  { id: "seed-ss", name: "Dual Single Coil" },
];

export const seedWiringTemplateSwitchTypeOptions: WiringTemplateReference[] = [
  { id: "seed-5-way-blade", name: "5-Way Blade Switch" },
  { id: "seed-3-way-toggle", name: "3-Way Toggle Switch" },
  { id: "seed-4-way-blade", name: "4-Way Blade Switch" },
  { id: "seed-dpdt-mini-toggle", name: "DPDT Mini Toggle" },
];

function mapRecord(record: PrismaWiringTemplateRecord): WiringTemplateRow {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    pickupConfigurationId: record.pickupConfigurationId,
    pickupConfigurationName: record.pickupConfiguration.name,
    switchTypeId: record.switchTypeId,
    switchTypeName: record.switchType.name,
    volumeCount: record.volumeCount,
    toneCount: record.toneCount,
    difficultyLevel: record.difficultyLevel,
    diagramJson: JSON.stringify(record.diagramJson),
    switchLogicJson: JSON.stringify(record.switchLogicJson),
    isVerified: record.isVerified,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    createdBy: record.createdBy,
    creatorId: null,
    creatorName: record.createdBy,
    creatorPhoto: null,
    viewCount: record.viewCount,
    loveCount: record.loveCount,
    saveCount: record.saveCount,
    currentUserLoved: false,
    currentUserSaved: false,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeCreatorLookupKey(value: string) {
  return value.trim().toLowerCase();
}

function applyCreatorDirectory<T extends WiringTemplateRow>(
  record: T,
  directory: Map<string, CreatorDirectoryEntry>
): T {
  const creator = directory.get(normalizeCreatorLookupKey(record.createdBy));

  if (!creator) {
    return record;
  }

  return {
    ...record,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorPhoto: creator.photoUrl,
  } satisfies T;
}

function mapDetailComponent(
  component: NonNullable<PrismaWiringTemplateRecord["components"]>[number],
  lookup: WiringTemplateComponentDetailLookup
): WiringTemplateDetailComponent {
  const detail = buildComponentDetail(component, lookup);
  const author = component.asset.publishedDrafts[0]?.user ?? null;

  return {
    id: component.id,
    componentRole: component.componentRole,
    componentType: component.componentType,
    assetId: component.assetId,
    assetName: component.asset.name,
    assetPreviewUrl: component.asset.svgUrl ?? component.asset.thumbnailUrl,
    assetWidth: component.asset.width,
    assetHeight: component.asset.height,
    assetAnchorPointsJson:
      component.asset.anchorPointsJson === null ||
      component.asset.anchorPointsJson === undefined
        ? null
        : JSON.stringify(component.asset.anchorPointsJson),
    assetAuthorName: author?.name ?? null,
    assetAuthorPhoto: author?.photoUrl ?? null,
    detailTitle: detail.detailTitle,
    detailSubtitle: detail.detailSubtitle,
    detailDescription: detail.detailDescription,
    detailSpecs: detail.detailSpecs,
    positionX: component.positionX,
    positionY: component.positionY,
    rotation: component.rotation,
    scale: component.scale,
    showLabel: component.showLabel,
    metadataJson:
      component.metadataJson === null || component.metadataJson === undefined
        ? null
        : JSON.stringify(component.metadataJson),
  };
}

function mapDetailConnection(
  connection: NonNullable<PrismaWiringTemplateRecord["connections"]>[number]
): WiringTemplateDetailConnection {
  return {
    id: connection.id,
    fromComponentRole: connection.fromComponentRole,
    fromPointKey: connection.fromPointKey,
    toComponentRole: connection.toComponentRole,
    toPointKey: connection.toPointKey,
    wireTypeId: connection.wireTypeId,
    wireTypeName: connection.wireType.name,
    wireColor: connection.wireColor,
    pathJson:
      connection.pathJson === null || connection.pathJson === undefined
        ? null
        : JSON.stringify(connection.pathJson),
    label: connection.label,
    notes: connection.notes,
  };
}

export async function getWiringTemplateRows(): Promise<WiringTemplateRow[]> {
  return getWiringTemplateRowsForUser(null);
}

export async function getWiringTemplateRowsForUser(
  userId: string | null
): Promise<WiringTemplateRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateRows;
    }

    const [templates, users, loves, saves] = await Promise.all([
      prisma.wiringTemplate.findMany({
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
        include: {
          pickupConfiguration: {
            select: { name: true },
          },
          switchType: {
            select: { name: true },
          },
        },
      }) as Promise<PrismaWiringTemplateRecord[]>,
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
        },
      }),
      userId
        ? prisma.wiringTemplateLove.findMany({
            where: { userId },
            select: {
              wiringTemplateId: true,
            },
          })
        : Promise.resolve([] as Array<{ wiringTemplateId: string }>),
      userId
        ? prisma.wiringTemplateSave.findMany({
            where: { userId },
            select: {
              wiringTemplateId: true,
            },
          })
        : Promise.resolve([] as Array<{ wiringTemplateId: string }>),
    ]);

    const creatorDirectory = new Map<string, CreatorDirectoryEntry>();
    const lovedTemplateIds = new Set(loves.map((love) => love.wiringTemplateId));
    const savedTemplateIds = new Set(saves.map((save) => save.wiringTemplateId));

    for (const user of users) {
      creatorDirectory.set(normalizeCreatorLookupKey(user.email), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
      creatorDirectory.set(normalizeCreatorLookupKey(user.name), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
    }

    return templates.map((template) => {
      const nextTemplate = applyCreatorDirectory(mapRecord(template), creatorDirectory);

      return {
        ...nextTemplate,
        currentUserLoved: lovedTemplateIds.has(template.id),
        currentUserSaved: savedTemplateIds.has(template.id),
      };
    });
  } catch {
    return seedWiringTemplateRows;
  }
}

export async function getWiringTemplateDetailById(
  id: string
): Promise<WiringTemplateDetail | null> {
  return getWiringTemplateDetailByIdForUser(id, null);
}

export async function getWiringTemplateDetailByIdForUser(
  id: string,
  userId: string | null
): Promise<WiringTemplateDetail | null> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      const fallback = seedWiringTemplateRows.find((item) => item.id === id) ?? null;

      if (!fallback) {
        return null;
      }

      return {
        ...fallback,
        components: [],
        connections: [],
      };
    }

    const [template, users, love, save] = await Promise.all([
      prisma.wiringTemplate.findUnique({
        where: { id },
        include: {
          pickupConfiguration: {
            select: { name: true },
          },
          switchType: {
            select: { name: true },
          },
          components: {
            orderBy: [{ componentRole: "asc" }, { componentType: "asc" }],
            include: {
              asset: {
                select: {
                  name: true,
                  svgUrl: true,
                  thumbnailUrl: true,
                  width: true,
                  height: true,
                  anchorPointsJson: true,
                  ownerType: true,
                  ownerId: true,
                  componentType: true,
                  publishedDrafts: {
                    take: 1,
                    where: { status: "PUBLISHED" },
                    select: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          photoUrl: true,
                        },
                      },
                    },
                  },
                },
              },
              pickupModel: {
                select: {
                  name: true,
                  positionType: true,
                  wireCount: true,
                  magnetType: true,
                  dcResistance: true,
                  outputLevel: true,
                  description: true,
                  pickupBrand: {
                    select: {
                      name: true,
                    },
                  },
                  pickupType: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              pickupType: {
                select: {
                  name: true,
                  coilCount: true,
                  description: true,
                },
              },
              switchType: {
                select: {
                  name: true,
                  positionCount: true,
                  poleCount: true,
                  lugCount: true,
                  switchCategory: true,
                  description: true,
                },
              },
              potType: {
                select: {
                  name: true,
                  valueLabel: true,
                  taper: true,
                  potFunction: true,
                  isPushPull: true,
                  isPushPush: true,
                  isNoLoad: true,
                  description: true,
                },
              },
              capacitor: {
                select: {
                  valueLabel: true,
                  type: true,
                  voltageRating: true,
                  description: true,
                },
              },
              resistor: {
                select: {
                  valueLabel: true,
                  wattage: true,
                  tolerance: true,
                  description: true,
                },
              },
              mod: {
                select: {
                  name: true,
                  difficultyLevel: true,
                  requiresPushPull: true,
                  requiresMiniToggle: true,
                  requiresSpecialSwitch: true,
                  description: true,
                },
              },
              outputJack: {
                select: {
                  name: true,
                  jackType: true,
                  mountingStyle: true,
                  conductorCount: true,
                  description: true,
                },
              },
            },
          },
          connections: {
            orderBy: [
              { fromComponentRole: "asc" },
              { toComponentRole: "asc" },
              { fromPointKey: "asc" },
              { toPointKey: "asc" },
            ],
            include: {
              wireType: {
                select: { name: true },
              },
            },
          },
        },
      }) as Promise<PrismaWiringTemplateRecord | null>,
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
        },
      }),
      userId
        ? prisma.wiringTemplateLove.findUnique({
            where: {
              userId_wiringTemplateId: {
                userId,
                wiringTemplateId: id,
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      userId
        ? prisma.wiringTemplateSave.findUnique({
            where: {
              userId_wiringTemplateId: {
                userId,
                wiringTemplateId: id,
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!template) {
      return null;
    }

    const componentLookup = await loadWiringTemplateComponentDetailLookup(
      prisma,
      template.components ?? []
    );

    const creatorDirectory = new Map<string, CreatorDirectoryEntry>();

    for (const user of users) {
      creatorDirectory.set(normalizeCreatorLookupKey(user.email), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
      creatorDirectory.set(normalizeCreatorLookupKey(user.name), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
    }

    return {
      ...applyCreatorDirectory(mapRecord(template), creatorDirectory),
      components: (template.components ?? []).map((component) =>
        mapDetailComponent(component, componentLookup)
      ),
      connections: (template.connections ?? []).map(mapDetailConnection),
      currentUserLoved: Boolean(love),
      currentUserSaved: Boolean(save),
    };
  } catch {
    const fallback = seedWiringTemplateRows.find((item) => item.id === id) ?? null;

    if (!fallback) {
      return null;
    }

    return {
      ...fallback,
      components: [],
      connections: [],
    };
  }
}

export async function incrementWiringTemplateViewCount(id: string) {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return;
    }

    await prisma.wiringTemplate.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch {
    // Ignore view-count failures so template detail remains accessible.
  }
}

export async function getSavedWiringTemplateRowsForUser(
  userId: string
): Promise<WiringTemplateRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return [];
    }

    const [savedRows, users, loves] = await Promise.all([
      prisma.wiringTemplateSave.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }],
        select: {
          wiringTemplate: {
            include: {
              pickupConfiguration: {
                select: { name: true },
              },
              switchType: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
        },
      }),
      prisma.wiringTemplateLove.findMany({
        where: { userId },
        select: {
          wiringTemplateId: true,
        },
      }),
    ]);

    const creatorDirectory = new Map<string, CreatorDirectoryEntry>();
    const lovedTemplateIds = new Set(loves.map((love) => love.wiringTemplateId));

    for (const user of users) {
      creatorDirectory.set(normalizeCreatorLookupKey(user.email), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
      creatorDirectory.set(normalizeCreatorLookupKey(user.name), {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
    }

    return savedRows.map((row) => {
      const template = row.wiringTemplate as PrismaWiringTemplateRecord;
      const nextTemplate = applyCreatorDirectory(mapRecord(template), creatorDirectory);

      return {
        ...nextTemplate,
        currentUserLoved: lovedTemplateIds.has(template.id),
        currentUserSaved: true,
      };
    });
  } catch {
    return [];
  }
}

export async function getWiringTemplatePickupConfigurationOptions(): Promise<
  WiringTemplateReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplatePickupConfigurationOptions;
    }

    return prisma.pickupConfiguration.findMany({
      orderBy: [{ pickupCount: "desc" }, { code: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplatePickupConfigurationOptions;
  }
}

export async function getWiringTemplateSwitchTypeOptions(): Promise<
  WiringTemplateReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWiringTemplateSwitchTypeOptions;
    }

    return prisma.switchType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedWiringTemplateSwitchTypeOptions;
  }
}
