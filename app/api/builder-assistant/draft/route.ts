import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSafeServerSession } from "@/lib/auth-session";
import { normalizeBuilderSavedSetupDocument } from "@/lib/custom-builder-saved-setup-types";
import { getPrismaClient } from "@/lib/prisma";

type DraftBody = {
  pickupConfigurationId?: string;
  switchTypeId?: string;
  volumeCount?: number;
  toneCount?: number;
  selectedModIds?: string[];
  experience?: string;
  toneGoal?: string;
  notes?: string;
};

type SavedSetupDelegate = {
  create: (args: {
    data: {
      userId: string;
      name: string;
      slug: string | null;
      description: string | null;
      thumbnailUrl: string | null;
      status: "DRAFT";
      documentJson: Prisma.InputJsonValue;
      publishedTemplateId: string | null;
      publishedAt: Date | null;
    };
  }) => Promise<{ id: string; name: string }>;
};

function toCount(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(4, Math.round(value)))
    : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

function makeInstance(input: {
  id: string;
  assetId: string;
  componentAssetId?: string | null;
  name: string;
  componentType: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  const width = input.width ?? 180;
  const height = input.height ?? 110;

  return {
    id: input.id,
    assetId: input.assetId,
    componentAssetId: input.componentAssetId ?? null,
    name: input.name,
    componentType: input.componentType,
    x: input.x,
    y: input.y,
    width,
    height,
    renderWidth: width,
    renderHeight: height,
    scale: 1,
    rotation: 0,
    showLabel: true,
    labelOffsetX: 0,
    labelOffsetY: height / 2 + 18,
  };
}

function makeConnection(input: {
  id: string;
  fromInstanceId: string;
  fromPointKey: string;
  toInstanceId: string;
  toPointKey: string;
  wireTypeId: string;
  controlPoints?: { x: number; y: number }[];
}) {
  return {
    id: input.id,
    fromInstanceId: input.fromInstanceId,
    fromPointKey: input.fromPointKey,
    toInstanceId: input.toInstanceId,
    toPointKey: input.toPointKey,
    wireTypeId: input.wireTypeId,
    controlPoints: input.controlPoints ?? [],
    tension: 0.35,
  };
}

function makeTextShape(input: { id: string; name: string; text: string; x: number; y: number; width: number }) {
  return {
    id: input.id,
    type: "text" as const,
    name: input.name,
    x: input.x,
    y: input.y,
    rotation: 0,
    opacity: 1,
    fill: "#f8fafc",
    stroke: "transparent",
    strokeWidth: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    text: input.text,
    fontSize: 18,
    fontFamily: "Inter",
    fontStyle: "normal",
    align: "left" as const,
    width: input.width,
    height: 120,
  };
}

export async function POST(request: Request) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json({ error: "Database connection is not available." }, { status: 503 });
  }

  const body = (await request.json()) as DraftBody;
  const volumeCount = toCount(body.volumeCount, 1);
  const toneCount = toCount(body.toneCount, 1);
  const selectedModIds = Array.isArray(body.selectedModIds) ? body.selectedModIds.filter(Boolean) : [];

  const [pickupConfiguration, switchType, mods, firstWireType] = await Promise.all([
    body.pickupConfigurationId
      ? prisma.pickupConfiguration.findUnique({ where: { id: body.pickupConfigurationId }, select: { id: true, code: true, name: true, pickupCount: true, hasNeck: true, hasMiddle: true, hasBridge: true } })
      : null,
    body.switchTypeId
      ? prisma.switchType.findUnique({ where: { id: body.switchTypeId }, select: { id: true, name: true, svgAssetId: true, positionCount: true, poleCount: true, lugCount: true } })
      : null,
    selectedModIds.length
      ? prisma.mod.findMany({ where: { id: { in: selectedModIds } }, select: { id: true, name: true } })
      : [],
    prisma.wireType.findFirst({ orderBy: { name: "asc" }, select: { id: true } }),
  ]);

  const pickupName = pickupConfiguration ? `${pickupConfiguration.code} ${pickupConfiguration.name}` : "Pickup layout";
  const switchName = switchType?.name ?? "Switch";
  const setupName = `Assistant Draft - ${pickupConfiguration?.code ?? "Custom"} ${switchName}`.slice(0, 80);
  const instanceList: ReturnType<typeof makeInstance>[] = [];
  let sequence = 1;

  const pickupPositions = [
    { label: "Neck Pickup", enabled: pickupConfiguration?.hasNeck ?? true, x: 140, y: 120 },
    { label: "Middle Pickup", enabled: pickupConfiguration?.hasMiddle ?? false, x: 140, y: 270 },
    { label: "Bridge Pickup", enabled: pickupConfiguration?.hasBridge ?? true, x: 140, y: 420 },
  ];

  for (const position of pickupPositions.filter((item) => item.enabled)) {
    instanceList.push(makeInstance({
      id: `builder-instance-${sequence++}`,
      assetId: `assistant-${slugify(position.label)}`,
      name: position.label,
      componentType: "Pickup",
      x: position.x,
      y: position.y,
      width: 190,
      height: 90,
    }));
  }

  instanceList.push(makeInstance({
    id: `builder-instance-${sequence++}`,
    assetId: switchType ? `switch-type:${switchType.id}` : "assistant-switch",
    componentAssetId: switchType?.svgAssetId ?? null,
    name: switchName,
    componentType: "Switch",
    x: 430,
    y: 250,
    width: 220,
    height: 130,
  }));

  for (let i = 0; i < volumeCount; i += 1) {
    instanceList.push(makeInstance({
      id: `builder-instance-${sequence++}`,
      assetId: `assistant-volume-${i + 1}`,
      name: `Volume ${i + 1}`,
      componentType: "Potentiometer",
      x: 720,
      y: 130 + i * 120,
      width: 150,
      height: 100,
    }));
  }

  for (let i = 0; i < toneCount; i += 1) {
    instanceList.push(makeInstance({
      id: `builder-instance-${sequence++}`,
      assetId: `assistant-tone-${i + 1}`,
      name: `Tone ${i + 1}`,
      componentType: "Potentiometer",
      x: 720,
      y: 390 + i * 120,
      width: 150,
      height: 100,
    }));
  }

  mods.forEach((mod, index) => {
    instanceList.push(makeInstance({
      id: `builder-instance-${sequence++}`,
      assetId: `mod:${mod.id}`,
      name: mod.name,
      componentType: "Mod",
      x: 1000,
      y: 150 + index * 120,
      width: 180,
      height: 100,
    }));
  });

  instanceList.push(makeInstance({
    id: `builder-instance-${sequence++}`,
    assetId: "assistant-output-jack",
    name: "Output Jack",
    componentType: "Output Jack",
    x: 1000,
    y: 470,
    width: 180,
    height: 100,
  }));

  instanceList.push(makeInstance({
    id: `builder-instance-${sequence++}`,
    assetId: "assistant-ground-bus",
    name: "Ground Bus",
    componentType: "Ground Bus",
    x: 420,
    y: 560,
    width: 420,
    height: 55,
  }));

  const wireTypeId = firstWireType?.id ?? null;
  const byName = (name: string) => instanceList.find((instance) => instance.name === name);
  const byPrefix = (prefix: string) => instanceList.find((instance) => instance.name.startsWith(prefix));
  const connections: ReturnType<typeof makeConnection>[] = [];
  let connectionSequence = 1;
  const addWire = (fromName: string, fromPointKey: string, toName: string, toPointKey: string) => {
    if (!wireTypeId) return;
    const from = byName(fromName);
    const to = byName(toName);
    if (!from || !to) return;
    connections.push(makeConnection({
      id: `builder-connection-${connectionSequence++}`,
      fromInstanceId: from.id,
      fromPointKey,
      toInstanceId: to.id,
      toPointKey,
      wireTypeId,
      controlPoints: [{ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }],
    }));
  };

  const switchInstance = byName(switchName);
  const mainVolume = byName("Volume 1");
  const outputJack = byName("Output Jack");
  const groundBus = byName("Ground Bus");
  const isFiveWay = (switchType?.positionCount ?? 0) >= 5 || /5\s*-?way/i.test(switchName);
  const isFourWay = (switchType?.positionCount ?? 0) === 4 || /4\s*-?way/i.test(switchName);
  const isThreeWay = (switchType?.positionCount ?? 0) === 3 || /3\s*-?way/i.test(switchName);
  const pickupCode = pickupConfiguration?.code?.toUpperCase() ?? "";

  if (wireTypeId && switchInstance && mainVolume && outputJack && groundBus) {
    if (pickupCode === "SSS" && isFiveWay) {
      addWire("Bridge Pickup", "hot", switchName, "lug1");
      addWire("Middle Pickup", "hot", switchName, "lug2");
      addWire("Neck Pickup", "hot", switchName, "lug3");
    } else if (pickupCode === "HH" && isThreeWay) {
      addWire("Bridge Pickup", "hot", switchName, "lug1");
      addWire("Neck Pickup", "hot", switchName, "lug3");
    } else if ((pickupCode === "SS" || pickupCode.includes("TELE")) && (isThreeWay || isFourWay)) {
      addWire("Bridge Pickup", "hot", switchName, "lug1");
      addWire("Neck Pickup", "hot", switchName, "lug3");
      if (isFourWay) addWire("Neck Pickup", "ground", switchName, "lug4");
    } else {
      addWire("Bridge Pickup", "hot", switchName, "lug1");
      addWire("Middle Pickup", "hot", switchName, "lug2");
      addWire("Neck Pickup", "hot", switchName, "lug3");
    }

    addWire(switchName, "common", "Volume 1", "lug1");
    addWire("Volume 1", "lug2", "Output Jack", "tip");
    addWire("Volume 1", "lug3", "Ground Bus", "ground");
    addWire("Output Jack", "sleeve", "Ground Bus", "ground");
    addWire(switchName, "ground", "Ground Bus", "ground");

    for (const pickup of ["Neck Pickup", "Middle Pickup", "Bridge Pickup"]) {
      addWire(pickup, "ground", "Ground Bus", "ground");
    }

    for (let i = 1; i <= volumeCount; i += 1) {
      addWire(`Volume ${i}`, "case-ground", "Ground Bus", "ground");
    }

    for (let i = 1; i <= toneCount; i += 1) {
      const toneName = `Tone ${i}`;
      if (byName(toneName)) {
        const targetVolume = byPrefix(`Volume ${Math.min(i, Math.max(volumeCount, 1))}`)?.name ?? "Volume 1";
        addWire(toneName, "lug1", targetVolume, "lug1");
        addWire(toneName, "lug3", "Ground Bus", "ground");
        addWire(toneName, "case-ground", "Ground Bus", "ground");
      }
    }
  }

  const note = [
    "Generated from Builder Assistant",
    `Pickup: ${pickupName}`,
    `Switch: ${switchName}`,
    `Controls: ${volumeCount} volume / ${toneCount} tone`,
    `Tone goal: ${body.toneGoal ?? "classic"}`,
    `Skill level: ${body.experience ?? "beginner"}`,
    mods.length ? `Mods: ${mods.map((mod) => mod.name).join(", ")}` : "Mods: none",
    body.notes ? `Notes: ${body.notes}` : null,
    connections.length ? `Auto-wired basic connections: ${connections.length}` : "Auto-wire could not run because no wire type was available.",
    "Next: review every wire, adjust routing, and validate against the real component lug layout before soldering.",
  ].filter(Boolean).join("\n");

  const document = normalizeBuilderSavedSetupDocument({
    version: 1,
    selectedWireTypeId: firstWireType?.id ?? null,
    instances: instanceList,
    connections,
    shapes: [
      makeTextShape({ id: "assistant-note-1", name: "Assistant Notes", text: note, x: 80, y: 620, width: 900 }),
    ],
  });

  const builderSavedSetup = (prisma as unknown as { builderSavedSetup: SavedSetupDelegate }).builderSavedSetup;
  const created = await builderSavedSetup.create({
    data: {
      userId: session.user.id,
      name: setupName,
      slug: `${slugify(setupName)}-${Date.now().toString(36)}`,
      description: "Draft generated from Builder Assistant.",
      thumbnailUrl: null,
      status: "DRAFT",
      documentJson: document as Prisma.InputJsonValue,
      publishedTemplateId: null,
      publishedAt: null,
    },
  });

  return NextResponse.json({
    id: created.id,
    name: created.name,
    redirectUrl: `/custom-builder?savedSetupId=${encodeURIComponent(created.id)}`,
  }, { status: 201 });
}
