import { getPrismaClient } from "@/lib/prisma";
import {
  type DiagramSourceReference,
  type DiagramSourceRow,
} from "@/lib/diagram-source-types";
import { seedWiringTemplateRows } from "@/lib/wiring-template-data";

type PrismaDiagramSourceRecord = {
  id: string;
  wiringTemplateId: string;
  sourceName: string;
  sourceBrand: string | null;
  sourceUrl: string | null;
  sourceFileUrl: string | null;
  sourceType: string | null;
  licenseNotes: string | null;
  isOfficial: boolean;
  verifiedAt: Date | null;
  notes: string | null;
  wiringTemplate: { name: string };
};

export const seedDiagramSourceRows: DiagramSourceRow[] = [
  {
    id: "seed-diagram-source-strat-fender",
    wiringTemplateId: "seed-wiring-template-strat-sss",
    wiringTemplateName: "Strat Standard SSS 5-Way",
    sourceName: "Stratocaster Service Diagram",
    sourceBrand: "Fender",
    sourceUrl: "https://example.com/fender-strat-service-diagram",
    sourceFileUrl: "https://example.com/files/fender-strat-service-diagram.pdf",
    sourceType: "Service Manual",
    licenseNotes: "Reference only. Verify redistribution rights before publishing files.",
    isOfficial: true,
    verifiedAt: new Date("2026-05-17T13:20:00.000Z").toISOString(),
    notes: "Primary factory reference for the standard SSS switch logic.",
  },
  {
    id: "seed-diagram-source-les-paul-forum",
    wiringTemplateId: "seed-wiring-template-les-paul-hh",
    wiringTemplateName: "Les Paul HH 3-Way",
    sourceName: "Les Paul Vintage Wiring Walkthrough",
    sourceBrand: "Independent Luthier",
    sourceUrl: "https://example.com/les-paul-vintage-wiring",
    sourceFileUrl: null,
    sourceType: "Article",
    licenseNotes: null,
    isOfficial: false,
    verifiedAt: null,
    notes: "Useful secondary comparison for non-factory capacitor routing notes.",
  },
];

export const seedDiagramSourceTemplateOptions: DiagramSourceReference[] =
  seedWiringTemplateRows.map((item) => ({
    id: item.id,
    name: item.name,
  }));

function mapRecord(record: PrismaDiagramSourceRecord): DiagramSourceRow {
  return {
    id: record.id,
    wiringTemplateId: record.wiringTemplateId,
    wiringTemplateName: record.wiringTemplate.name,
    sourceName: record.sourceName,
    sourceBrand: record.sourceBrand,
    sourceUrl: record.sourceUrl,
    sourceFileUrl: record.sourceFileUrl,
    sourceType: record.sourceType,
    licenseNotes: record.licenseNotes,
    isOfficial: record.isOfficial,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    notes: record.notes,
  };
}

export async function getDiagramSourceRows(): Promise<DiagramSourceRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedDiagramSourceRows;
    }

    const diagramSources = (await prisma.diagramSource.findMany({
      orderBy: [
        { isOfficial: "desc" },
        { verifiedAt: "desc" },
        { sourceName: "asc" },
      ],
      include: {
        wiringTemplate: {
          select: { name: true },
        },
      },
    })) as PrismaDiagramSourceRecord[];

    return diagramSources.map(mapRecord);
  } catch {
    return seedDiagramSourceRows;
  }
}

export async function getDiagramSourceTemplateOptions(): Promise<
  DiagramSourceReference[]
> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedDiagramSourceTemplateOptions;
    }

    return prisma.wiringTemplate.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    });
  } catch {
    return seedDiagramSourceTemplateOptions;
  }
}
