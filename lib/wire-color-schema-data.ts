import { getPrismaClient } from "@/lib/prisma";
import { seedBrandRows } from "@/lib/brand-data";
import { seedPickupTypeRows } from "@/lib/pickup-type-data";
import {
  type WireColorSchemaReference,
  type WireColorSchemaRow,
} from "@/lib/wire-color-schema-types";

type PrismaWireColorSchemaRecord = {
  id: string;
  pickupBrandId: string;
  name: string;
  pickupTypeId: string;
  hotColor: string | null;
  groundColor: string | null;
  shieldColor: string | null;
  northStartColor: string | null;
  northFinishColor: string | null;
  southStartColor: string | null;
  southFinishColor: string | null;
  batteryPositiveColor: string | null;
  batteryNegativeColor: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  pickupBrand: { name: string };
  pickupType: { name: string };
};

export const seedWireColorSchemaRows: WireColorSchemaRow[] = [
  {
    id: "seed-fender-vintage-single-coil",
    pickupBrandId: "seed-fender",
    pickupBrandName: "Fender",
    name: "Fender Vintage Single Coil",
    pickupTypeId: "seed-single-coil",
    pickupTypeName: "Vintage Strat",
    hotColor: "White",
    groundColor: "Black",
    shieldColor: null,
    northStartColor: null,
    northFinishColor: null,
    southStartColor: null,
    southFinishColor: null,
    batteryPositiveColor: null,
    batteryNegativeColor: null,
    notes: "Common two-conductor vintage Fender lead wire convention.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-gibson-humbucker-modern",
    pickupBrandId: "seed-gibson",
    pickupBrandName: "Gibson",
    name: "Gibson Modern Humbucker",
    pickupTypeId: "seed-humbucker",
    pickupTypeName: "Modern Output",
    hotColor: "Red",
    groundColor: "Black",
    shieldColor: "Bare",
    northStartColor: "Green",
    northFinishColor: "White",
    southStartColor: "Black",
    southFinishColor: "Red",
    batteryPositiveColor: null,
    batteryNegativeColor: null,
    notes: "Typical four-conductor plus bare shield layout for coil split capable wiring.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "seed-ibanez-piezo-active",
    pickupBrandId: "seed-ibanez",
    pickupBrandName: "Ibanez",
    name: "Ibanez Active Piezo",
    pickupTypeId: "seed-piezo",
    pickupTypeName: "Bridge Piezo",
    hotColor: "Yellow",
    groundColor: "Black",
    shieldColor: "Silver",
    northStartColor: null,
    northFinishColor: null,
    southStartColor: null,
    southFinishColor: null,
    batteryPositiveColor: "Red",
    batteryNegativeColor: "Black",
    notes: "Includes battery lead colors for active onboard preamp systems.",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
];

function mapWireColorSchemaRecord(
  record: PrismaWireColorSchemaRecord
): WireColorSchemaRow {
  return {
    id: record.id,
    pickupBrandId: record.pickupBrandId,
    pickupBrandName: record.pickupBrand.name,
    name: record.name,
    pickupTypeId: record.pickupTypeId,
    pickupTypeName: record.pickupType.name,
    hotColor: record.hotColor,
    groundColor: record.groundColor,
    shieldColor: record.shieldColor,
    northStartColor: record.northStartColor,
    northFinishColor: record.northFinishColor,
    southStartColor: record.southStartColor,
    southFinishColor: record.southFinishColor,
    batteryPositiveColor: record.batteryPositiveColor,
    batteryNegativeColor: record.batteryNegativeColor,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getWireColorSchemaRows(): Promise<WireColorSchemaRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedWireColorSchemaRows;
    }

    const schemas = (await prisma.wireColorSchema.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        pickupBrandId: true,
        name: true,
        pickupTypeId: true,
        hotColor: true,
        groundColor: true,
        shieldColor: true,
        northStartColor: true,
        northFinishColor: true,
        southStartColor: true,
        southFinishColor: true,
        batteryPositiveColor: true,
        batteryNegativeColor: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        pickupBrand: { select: { name: true } },
        pickupType: { select: { name: true } },
      },
    })) as PrismaWireColorSchemaRecord[];

    return schemas.map(mapWireColorSchemaRecord);
  } catch {
    return seedWireColorSchemaRows;
  }
}

export async function getWireColorSchemaReferences(): Promise<{
  brands: WireColorSchemaReference[];
  pickupTypes: WireColorSchemaReference[];
}> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        brands: seedBrandRows.map(({ id, name }) => ({ id, name })),
        pickupTypes: seedPickupTypeRows.map(({ id, name }) => ({ id, name })),
      };
    }

    const [brands, pickupTypes] = await Promise.all([
      prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.pickupType.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return { brands, pickupTypes };
  } catch {
    return {
      brands: seedBrandRows.map(({ id, name }) => ({ id, name })),
      pickupTypes: seedPickupTypeRows.map(({ id, name }) => ({ id, name })),
    };
  }
}
