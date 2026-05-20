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
    positionX: number;
    positionY: number;
    rotation: number;
    scale: number;
    showLabel: boolean;
    metadataJson: unknown;
    asset: { name: string };
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
  component: NonNullable<PrismaWiringTemplateRecord["components"]>[number]
): WiringTemplateDetailComponent {
  return {
    id: component.id,
    componentRole: component.componentRole,
    componentType: component.componentType,
    assetId: component.assetId,
    assetName: component.asset.name,
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

function mapDetailRecord(record: PrismaWiringTemplateRecord): WiringTemplateDetail {
  return {
    ...mapRecord(record),
    components: (record.components ?? []).map(mapDetailComponent),
    connections: (record.connections ?? []).map(mapDetailConnection),
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
                select: { name: true },
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
      ...applyCreatorDirectory(mapDetailRecord(template), creatorDirectory),
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
