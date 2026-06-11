import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const COLORS = {
  signal: "#ef4444",
  ground: "#111827",
  common: "#22c55e",
  lug: "#f97316",
  coil: "#3b82f6",
  shield: "#6b7280",
  passive: "#a855f7",
};

function point(pointKey, label, pointType, color, x, y, description = null) {
  return { pointKey, label, pointType, color, x, y, description };
}

const standardComponents = [
  {
    name: "Standard Single Coil Pickup",
    slug: "std-pickup-single-coil",
    componentType: "Pickup",
    width: 220,
    height: 90,
    styleType: "standard",
    points: [
      point("hot", "Hot", "signal", COLORS.signal, 220, 32, "Pickup hot signal output"),
      point("ground", "Ground", "ground", COLORS.ground, 220, 62, "Pickup ground"),
      point("shield", "Shield", "ground", COLORS.shield, 220, 82, "Optional shield / cover ground"),
    ],
  },
  {
    name: "Standard Humbucker 2-Conductor Pickup",
    slug: "std-pickup-humbucker-2-conductor",
    componentType: "Pickup",
    width: 240,
    height: 110,
    styleType: "standard",
    points: [
      point("hot", "Hot", "signal", COLORS.signal, 240, 35, "Humbucker hot output"),
      point("ground", "Ground", "ground", COLORS.ground, 240, 65, "Humbucker ground"),
      point("shield", "Shield", "ground", COLORS.shield, 240, 92, "Shield / bare wire"),
    ],
  },
  {
    name: "Standard Humbucker 4-Conductor Pickup",
    slug: "std-pickup-humbucker-4-conductor",
    componentType: "Pickup",
    width: 260,
    height: 160,
    styleType: "standard",
    points: [
      point("north-start", "North Start", "coil", COLORS.coil, 260, 25, "North coil start"),
      point("north-finish", "North Finish", "coil", "#22c55e", 260, 50, "North coil finish"),
      point("south-start", "South Start", "coil", "#f8fafc", 260, 75, "South coil start"),
      point("south-finish", "South Finish", "coil", COLORS.ground, 260, 100, "South coil finish"),
      point("bare-ground", "Bare Ground", "ground", COLORS.shield, 260, 125, "Bare shield ground"),
      point("hot", "Logical Hot", "signal", COLORS.signal, 260, 145, "Logical hot alias for simple auto-wire"),
      point("ground", "Logical Ground", "ground", COLORS.ground, 0, 145, "Logical ground alias for simple auto-wire"),
      point("series-link", "Series Link", "coil", COLORS.common, 0, 72, "Series link / coil split node"),
    ],
  },
  {
    name: "Standard 3-Way Toggle Switch",
    slug: "std-switch-3-way-toggle",
    componentType: "Switch",
    width: 220,
    height: 120,
    styleType: "standard",
    points: [
      point("neck", "Neck", "input", COLORS.coil, 0, 35, "Neck pickup input"),
      point("bridge", "Bridge", "input", COLORS.signal, 0, 75, "Bridge pickup input"),
      point("common", "Common", "output", COLORS.common, 220, 55, "Switch common output"),
      point("ground", "Ground", "ground", COLORS.ground, 220, 95, "Switch chassis ground"),
      point("lug1", "Lug 1 / Bridge", "lug", COLORS.lug, 0, 95, "Physical lug alias for bridge input"),
      point("lug3", "Lug 3 / Neck", "lug", COLORS.lug, 0, 15, "Physical lug alias for neck input"),
    ],
  },
  {
    name: "Standard 3-Way Blade Switch",
    slug: "std-switch-3-way-blade",
    componentType: "Switch",
    width: 240,
    height: 120,
    styleType: "standard",
    points: [
      point("lug1", "Lug 1", "lug", COLORS.lug, 0, 25, "Bridge input"),
      point("lug2", "Lug 2", "lug", COLORS.lug, 0, 55, "Middle / shared input"),
      point("lug3", "Lug 3", "lug", COLORS.lug, 0, 85, "Neck input"),
      point("common", "Common", "common", COLORS.common, 240, 55, "Switch common output"),
      point("ground", "Ground", "ground", COLORS.ground, 240, 95, "Switch frame ground"),
    ],
  },
  {
    name: "Standard 4-Way Blade Switch",
    slug: "std-switch-4-way-blade",
    componentType: "Switch",
    width: 250,
    height: 140,
    styleType: "standard",
    points: [
      point("lug1", "Lug 1", "lug", COLORS.lug, 0, 24, "Bridge input"),
      point("lug2", "Lug 2", "lug", COLORS.lug, 0, 50, "Neck input"),
      point("lug3", "Lug 3", "lug", COLORS.lug, 0, 76, "Series link"),
      point("lug4", "Lug 4", "lug", COLORS.lug, 0, 102, "Neck ground lift / series"),
      point("common", "Common", "common", COLORS.common, 250, 65, "Switch common output"),
      point("ground", "Ground", "ground", COLORS.ground, 250, 110, "Switch frame ground"),
    ],
  },
  {
    name: "Standard 5-Way Blade Switch",
    slug: "std-switch-5-way-blade",
    componentType: "Switch",
    width: 280,
    height: 160,
    styleType: "standard",
    points: [
      point("a1", "A1", "lug", COLORS.lug, 0, 25, "Pole A lug 1 / bridge"),
      point("a2", "A2", "lug", COLORS.lug, 0, 50, "Pole A lug 2 / middle"),
      point("a3", "A3", "lug", COLORS.lug, 0, 75, "Pole A lug 3 / neck"),
      point("a-common", "A Common", "common", COLORS.common, 0, 105, "Pole A common output"),
      point("b1", "B1", "lug", COLORS.lug, 280, 25, "Pole B lug 1"),
      point("b2", "B2", "lug", COLORS.lug, 280, 50, "Pole B lug 2"),
      point("b3", "B3", "lug", COLORS.lug, 280, 75, "Pole B lug 3"),
      point("b-common", "B Common", "common", COLORS.common, 280, 105, "Pole B common"),
      point("common", "Logical Common", "common", COLORS.common, 140, 125, "Logical common alias for simple auto-wire"),
      point("lug1", "Logical Lug 1", "lug", COLORS.lug, 140, 25, "Logical bridge alias"),
      point("lug2", "Logical Lug 2", "lug", COLORS.lug, 140, 50, "Logical middle alias"),
      point("lug3", "Logical Lug 3", "lug", COLORS.lug, 140, 75, "Logical neck alias"),
      point("ground", "Ground", "ground", COLORS.ground, 140, 150, "Switch frame ground"),
    ],
  },
  {
    name: "Standard Volume Potentiometer",
    slug: "std-pot-volume",
    componentType: "Potentiometer",
    width: 150,
    height: 110,
    styleType: "standard",
    points: [
      point("lug1", "Lug 1 / Input", "lug", COLORS.lug, 0, 28, "Volume pot input"),
      point("lug2", "Lug 2 / Wiper", "wiper", COLORS.common, 0, 55, "Volume wiper / output"),
      point("lug3", "Lug 3 / Ground", "lug", COLORS.lug, 0, 82, "Volume pot ground side"),
      point("case-ground", "Case Ground", "ground", COLORS.ground, 150, 82, "Pot casing ground"),
    ],
  },
  {
    name: "Standard Tone Potentiometer",
    slug: "std-pot-tone",
    componentType: "Potentiometer",
    width: 150,
    height: 110,
    styleType: "standard",
    points: [
      point("lug1", "Lug 1", "lug", COLORS.lug, 0, 28, "Tone pot lug 1"),
      point("lug2", "Lug 2 / Wiper", "wiper", COLORS.common, 0, 55, "Tone pot wiper"),
      point("lug3", "Lug 3", "lug", COLORS.lug, 0, 82, "Tone pot lug 3"),
      point("case-ground", "Case Ground", "ground", COLORS.ground, 150, 82, "Pot casing ground"),
    ],
  },
  {
    name: "Standard Capacitor",
    slug: "std-capacitor",
    componentType: "Capacitor",
    width: 130,
    height: 70,
    styleType: "standard",
    points: [
      point("lead1", "Lead 1", "passive", COLORS.passive, 0, 35, "Capacitor lead 1"),
      point("lead2", "Lead 2", "passive", COLORS.passive, 130, 35, "Capacitor lead 2"),
    ],
  },
  {
    name: "Standard Mono Output Jack",
    slug: "std-output-jack-mono",
    componentType: "Output Jack",
    width: 160,
    height: 90,
    styleType: "standard",
    points: [
      point("tip", "Tip", "signal-output", COLORS.common, 0, 35, "Signal output to amplifier"),
      point("sleeve", "Sleeve", "ground", COLORS.ground, 0, 70, "Output jack ground"),
    ],
  },
  {
    name: "Standard Stereo Output Jack",
    slug: "std-output-jack-stereo",
    componentType: "Output Jack",
    width: 170,
    height: 110,
    styleType: "standard",
    points: [
      point("tip", "Tip", "signal-output", COLORS.common, 0, 30, "Signal output"),
      point("ring", "Ring", "signal-output", COLORS.coil, 0, 60, "Ring / battery switching"),
      point("sleeve", "Sleeve", "ground", COLORS.ground, 0, 90, "Ground"),
    ],
  },
  {
    name: "Standard Ground Bus",
    slug: "std-ground-bus",
    componentType: "Ground Bus",
    width: 420,
    height: 55,
    styleType: "standard",
    points: [
      point("ground", "Ground Bus", "ground", COLORS.ground, 210, 28, "Shared ground node"),
    ],
  },
  {
    name: "Standard DPDT Mini Toggle",
    slug: "std-switch-dpdt-mini-toggle",
    componentType: "Switch",
    width: 180,
    height: 130,
    styleType: "standard",
    points: [
      point("a1", "A1", "lug", COLORS.lug, 0, 30, "Pole A throw 1"),
      point("a2", "A2 / Common", "common", COLORS.common, 0, 65, "Pole A common"),
      point("a3", "A3", "lug", COLORS.lug, 0, 100, "Pole A throw 2"),
      point("b1", "B1", "lug", COLORS.lug, 180, 30, "Pole B throw 1"),
      point("b2", "B2 / Common", "common", COLORS.common, 180, 65, "Pole B common"),
      point("b3", "B3", "lug", COLORS.lug, 180, 100, "Pole B throw 2"),
    ],
  },
  {
    name: "Standard Push-Pull Potentiometer",
    slug: "std-pot-push-pull-dpdt",
    componentType: "Potentiometer",
    width: 220,
    height: 180,
    styleType: "standard",
    points: [
      point("lug1", "Pot Lug 1", "lug", COLORS.lug, 0, 35, "Pot lug 1"),
      point("lug2", "Pot Lug 2 / Wiper", "wiper", COLORS.common, 0, 70, "Pot wiper"),
      point("lug3", "Pot Lug 3", "lug", COLORS.lug, 0, 105, "Pot lug 3"),
      point("case-ground", "Case Ground", "ground", COLORS.ground, 0, 140, "Pot casing ground"),
      point("a1", "A1", "lug", COLORS.lug, 220, 25, "DPDT pole A throw 1"),
      point("a2", "A2 / Common", "common", COLORS.common, 220, 55, "DPDT pole A common"),
      point("a3", "A3", "lug", COLORS.lug, 220, 85, "DPDT pole A throw 2"),
      point("b1", "B1", "lug", COLORS.lug, 220, 115, "DPDT pole B throw 1"),
      point("b2", "B2 / Common", "common", COLORS.common, 220, 145, "DPDT pole B common"),
      point("b3", "B3", "lug", COLORS.lug, 220, 175, "DPDT pole B throw 2"),
    ],
  },
];

async function upsertStandardComponent(component) {
  const anchorPointsJson = component.points.map((item) => ({ ...item }));

  const asset = await prisma.componentAsset.upsert({
    where: { slug: component.slug },
    create: {
      ownerType: "standard-component",
      ownerId: component.slug,
      componentType: component.componentType,
      name: component.name,
      slug: component.slug,
      svgUrl: null,
      thumbnailUrl: null,
      width: component.width,
      height: component.height,
      anchorPointsJson,
      editorDocumentJson: {},
      styleType: component.styleType,
      isActive: true,
    },
    update: {
      componentType: component.componentType,
      name: component.name,
      width: component.width,
      height: component.height,
      anchorPointsJson,
      styleType: component.styleType,
      isActive: true,
    },
  });

  const existing = await prisma.componentConnectionPoint.findMany({
    where: { componentAssetId: asset.id },
    select: { id: true, pointKey: true },
  });
  const expectedKeys = new Set(component.points.map((item) => item.pointKey));

  for (const stale of existing) {
    if (!expectedKeys.has(stale.pointKey)) {
      await prisma.componentConnectionPoint.delete({ where: { id: stale.id } });
    }
  }

  for (const item of component.points) {
    await prisma.componentConnectionPoint.upsert({
      where: { componentAssetId_pointKey: { componentAssetId: asset.id, pointKey: item.pointKey } },
      create: {
        componentAssetId: asset.id,
        pointKey: item.pointKey,
        label: item.label,
        pointType: item.pointType,
        x: item.x,
        y: item.y,
        description: item.description,
      },
      update: {
        label: item.label,
        pointType: item.pointType,
        x: item.x,
        y: item.y,
        description: item.description,
      },
    });
  }

  return asset;
}

try {
  console.log(`Seeding ${standardComponents.length} standard components...`);
  for (const component of standardComponents) {
    const asset = await upsertStandardComponent(component);
    console.log(`✓ ${asset.slug} (${component.points.length} pins)`);
  }
  console.log("Done.");
} finally {
  await prisma.$disconnect();
}
