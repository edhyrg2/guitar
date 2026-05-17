import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const users = [
  {
    name: "Maya Chen",
    email: "maya@northstar.app",
    passwordHash: "$2b$12$maya-demo-password-hash",
    level: "MASTER",
    photoUrl: "MC",
    isActive: true,
    emailVerifiedAt: new Date("2026-05-02T09:00:00.000Z"),
  },
  {
    name: "Rafi Hidayat",
    email: "rafi@northstar.app",
    passwordHash: "$2b$12$rafi-demo-password-hash",
    level: "DEVELOPER",
    photoUrl: "RH",
    isActive: true,
    emailVerifiedAt: null,
  },
  {
    name: "Daniel Putra",
    email: "daniel@northstar.app",
    passwordHash: "$2b$12$daniel-demo-password-hash",
    level: "DEVELOPER",
    photoUrl: "DP",
    isActive: false,
    emailVerifiedAt: new Date("2026-04-28T10:30:00.000Z"),
  },
  {
    name: "Asha Kartika",
    email: "asha@northstar.app",
    passwordHash: "$2b$12$asha-demo-password-hash",
    level: "USER",
    photoUrl: "AK",
    isActive: true,
    emailVerifiedAt: null,
  },
  {
    name: "Sinta Wulandari",
    email: "sinta@northstar.app",
    passwordHash: "$2b$12$sinta-demo-password-hash",
    level: "USER",
    photoUrl: "SW",
    isActive: true,
    emailVerifiedAt: new Date("2026-05-11T14:15:00.000Z"),
  },
  {
    name: "Budi Santoso",
    email: "budi@northstar.app",
    passwordHash: "$2b$12$budi-demo-password-hash",
    level: "MASTER",
    photoUrl: "BS",
    isActive: false,
    emailVerifiedAt: null,
  },
  {
    name: "Nadia Putri",
    email: "nadia@northstar.app",
    passwordHash: "$2b$12$nadia-demo-password-hash",
    level: "DEVELOPER",
    photoUrl: "NP",
    isActive: true,
    emailVerifiedAt: new Date("2026-05-09T07:45:00.000Z"),
  },
  {
    name: "Farhan Malik",
    email: "farhan@northstar.app",
    passwordHash: "$2b$12$farhan-demo-password-hash",
    level: "USER",
    photoUrl: "FM",
    isActive: true,
    emailVerifiedAt: null,
  },
];

const brands = [
  {
    name: "Fender",
    slug: "fender",
    logo: "F",
    website: "https://www.fender.com",
    type: "Electric Guitar",
    country: "United States",
    active: true,
  },
  {
    name: "Gibson",
    slug: "gibson",
    logo: "G",
    website: "https://www.gibson.com",
    type: "Electric Guitar",
    country: "United States",
    active: true,
  },
  {
    name: "Ibanez",
    slug: "ibanez",
    logo: "I",
    website: "https://www.ibanez.com",
    type: "Electric Guitar",
    country: "Japan",
    active: true,
  },
  {
    name: "Gretsch",
    slug: "gretsch",
    logo: "GR",
    website: null,
    type: "Hollow Body",
    country: "United States",
    active: false,
  },
];

const pickupTypes = [
  {
    name: "Vintage Strat",
    slug: "vintage-strat",
    coilCount: "Single Coil",
    isActive: true,
    description: "Traditional bright single coil voice for strat-style setups.",
  },
  {
    name: "Modern Output",
    slug: "modern-output",
    coilCount: "Humbucker",
    isActive: true,
    description: "Full-size humbucker used for higher output and reduced noise.",
  },
  {
    name: "Soapbar Classic",
    slug: "soapbar-classic",
    coilCount: "P90",
    isActive: true,
    description: "Mid-forward single-coil style pickup with wider bobbin response.",
  },
  {
    name: "Bridge Piezo",
    slug: "bridge-piezo",
    coilCount: "Piezo",
    isActive: false,
    description: "Used for acoustic-like bridge transducer systems.",
  },
];

const pickupModels = [
  {
    brandSlug: "fender",
    pickupTypeSlug: "vintage-strat",
    name: "Custom Shop '69 Strat Set",
    slug: "custom-shop-69-strat-set",
    positionType: "Neck / Middle / Bridge",
    wireCount: "2 Conductor",
    magnetType: "Alnico 5",
    dcResistance: "5.8k",
    outputLevel: "Vintage",
    isActivePickup: true,
    colorCodeSchemaId: null,
    description: "Classic low-output strat pickup set with bright top end.",
  },
  {
    brandSlug: "gibson",
    pickupTypeSlug: "modern-output",
    name: "'57 Classic",
    slug: "57-classic",
    positionType: "Neck / Bridge",
    wireCount: "2 Conductor",
    magnetType: "Alnico 2",
    dcResistance: "7.6k",
    outputLevel: "Medium",
    isActivePickup: true,
    colorCodeSchemaId: null,
    description: "PAF-inspired humbucker with warm mids and smooth highs.",
  },
  {
    brandSlug: "ibanez",
    pickupTypeSlug: "soapbar-classic",
    name: "Soapbar Modern Prototype",
    slug: "soapbar-modern-prototype",
    positionType: "Bridge",
    wireCount: "4 Conductor",
    magnetType: "Ceramic",
    dcResistance: "12.4k",
    outputLevel: "High",
    isActivePickup: false,
    colorCodeSchemaId: "ibz-proto-4-wire",
    description: "Prototype entry for high-output soapbar-style builds.",
  },
];

const guitarBrands = [
  {
    name: "Fender",
    slug: "fender",
    logoUrl: "https://logo.clearbit.com/fender.com",
    country: "United States",
    website: "https://www.fender.com",
    isActive: true,
  },
  {
    name: "Gibson",
    slug: "gibson",
    logoUrl: "https://logo.clearbit.com/gibson.com",
    country: "United States",
    website: "https://www.gibson.com",
    isActive: true,
  },
  {
    name: "Ibanez",
    slug: "ibanez",
    logoUrl: "https://logo.clearbit.com/ibanez.com",
    country: "Japan",
    website: "https://www.ibanez.com",
    isActive: true,
  },
  {
    name: "PRS",
    slug: "prs",
    logoUrl: null,
    country: "United States",
    website: "https://prsguitars.com",
    isActive: false,
  },
];

const guitarModels = [
  {
    guitarBrandSlug: "fender",
    name: "Stratocaster",
    slug: "stratocaster",
    series: "American Professional II",
    yearStart: 2020,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "SSS",
    description: "Modern strat platform with classic contours and updated appointments.",
    isActive: true,
  },
  {
    guitarBrandSlug: "gibson",
    name: "Les Paul Standard",
    slug: "les-paul-standard",
    series: "50s",
    yearStart: 2019,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "HH",
    description: "Traditional carved-top single cut with vintage-leaning electronics.",
    isActive: true,
  },
  {
    guitarBrandSlug: "ibanez",
    name: "RG",
    slug: "rg",
    series: "Prestige",
    yearStart: 2003,
    yearEnd: null,
    bodyType: "Solid Body",
    defaultPickupConfig: "HSH",
    description: "High-performance superstrat family with fast necks and modern switching.",
    isActive: true,
  },
];

const wireColorSchemas = [
  {
    brandSlug: "fender",
    pickupTypeSlug: "vintage-strat",
    name: "Fender Vintage Single Coil",
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
  },
  {
    brandSlug: "gibson",
    pickupTypeSlug: "modern-output",
    name: "Gibson Modern Humbucker",
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
  },
  {
    brandSlug: "ibanez",
    pickupTypeSlug: "bridge-piezo",
    name: "Ibanez Active Piezo",
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
  },
];

const pickupConfigurations = [
  {
    code: "SSS",
    name: "Three Single Coil",
    pickupCount: 3,
    hasNeck: true,
    hasMiddle: true,
    hasBridge: true,
    description: "Classic three single-coil layout used on many Strat-style guitars.",
  },
  {
    code: "HH",
    name: "Dual Humbucker",
    pickupCount: 2,
    hasNeck: true,
    hasMiddle: false,
    hasBridge: true,
    description: "Two humbuckers, typically neck and bridge positions.",
  },
  {
    code: "HSH",
    name: "Humbucker Single Humbucker",
    pickupCount: 3,
    hasNeck: true,
    hasMiddle: true,
    hasBridge: true,
    description: "Modern versatile layout with neck humbucker, middle single, bridge humbucker.",
  },
  {
    code: "SS",
    name: "Dual Single Coil",
    pickupCount: 2,
    hasNeck: true,
    hasMiddle: false,
    hasBridge: true,
    description: "Simple two single-coil configuration for many offset and tele-style variants.",
  },
];

const switchTypes = [
  {
    name: "5-Way Blade Switch",
    slug: "5-way-blade-switch",
    positionCount: 5,
    poleCount: 2,
    lugCount: 8,
    switchCategory: "Blade",
    description: "Common strat-style selector with five positions and dual poles.",
    svgAssetId: "switch-blade-5-way",
    isActive: true,
  },
  {
    name: "3-Way Toggle Switch",
    slug: "3-way-toggle-switch",
    positionCount: 3,
    poleCount: 2,
    lugCount: 3,
    switchCategory: "Toggle",
    description: "Les Paul style pickup selector for neck, both, and bridge.",
    svgAssetId: "switch-toggle-3-way",
    isActive: true,
  },
  {
    name: "4-Way Blade Switch",
    slug: "4-way-blade-switch",
    positionCount: 4,
    poleCount: 2,
    lugCount: 8,
    switchCategory: "Blade",
    description: "Tele-style upgrade switch for adding series wiring options.",
    svgAssetId: "switch-blade-4-way",
    isActive: true,
  },
  {
    name: "DPDT Mini Toggle",
    slug: "dpdt-mini-toggle",
    positionCount: 2,
    poleCount: 2,
    lugCount: 6,
    switchCategory: "Mini Toggle",
    description: "Common DPDT on-on switch for coil split, phase, or series mods.",
    svgAssetId: "switch-mini-toggle-dpdt",
    isActive: false,
  },
];

const potTypes = [
  {
    name: "250K Audio Volume",
    valueOhm: 250000,
    valueLabel: "250K",
    taper: "Audio",
    potFunction: "Volume",
    isPushPull: false,
    isPushPush: false,
    isNoLoad: false,
    shaftType: "Split Shaft",
    description: "Common volume pot for single-coil guitar circuits.",
    isActive: true,
  },
  {
    name: "500K Audio Tone Push Pull",
    valueOhm: 500000,
    valueLabel: "500K",
    taper: "Audio",
    potFunction: "Tone",
    isPushPull: true,
    isPushPush: false,
    isNoLoad: false,
    shaftType: "Long Split Shaft",
    description: "Tone pot with push-pull switch commonly used for coil splitting.",
    isActive: true,
  },
  {
    name: "250K No Load Tone",
    valueOhm: 250000,
    valueLabel: "250K",
    taper: "Audio",
    potFunction: "Tone",
    isPushPull: false,
    isPushPush: false,
    isNoLoad: true,
    shaftType: "Solid Shaft",
    description: "No-load tone pot that removes itself from the circuit at max setting.",
    isActive: true,
  },
  {
    name: "500K Linear Blend Push Push",
    valueOhm: 500000,
    valueLabel: "500K",
    taper: "Linear",
    potFunction: "Blend",
    isPushPull: false,
    isPushPush: true,
    isNoLoad: false,
    shaftType: "Split Shaft",
    description: "Blend control with push-push switching for alternate routing.",
    isActive: false,
  },
];

const capacitors = [
  {
    valueFarads: 0.000000022,
    valueLabel: "0.022uF",
    type: "Poly Film",
    voltageRating: "400V",
    description: "Popular tone capacitor value for humbucker circuits.",
    isActive: true,
  },
  {
    valueFarads: 0.000000047,
    valueLabel: "0.047uF",
    type: "Poly Film",
    voltageRating: "400V",
    description: "Common tone capacitor value for single-coil circuits.",
    isActive: true,
  },
  {
    valueFarads: 0.000000015,
    valueLabel: "0.015uF",
    type: "Paper In Oil",
    voltageRating: "200V",
    description: "Brighter roll-off option often used on neck humbuckers.",
    isActive: true,
  },
  {
    valueFarads: 0.000000001,
    valueLabel: "0.001uF",
    type: "Ceramic",
    voltageRating: "50V",
    description: "Small cap value useful for treble bleed networks and special mods.",
    isActive: false,
  },
];

const resistors = [
  {
    valueOhm: 150000,
    valueLabel: "150K",
    wattage: "1/4W",
    tolerance: "5%",
    description: "Common treble bleed network value when paired with a small capacitor.",
    isActive: true,
  },
  {
    valueOhm: 220000,
    valueLabel: "220K",
    wattage: "1/4W",
    tolerance: "5%",
    description: "Useful for bleed and loading adjustments in guitar circuits.",
    isActive: true,
  },
  {
    valueOhm: 470000,
    valueLabel: "470K",
    wattage: "1/4W",
    tolerance: "1%",
    description: "Often used to simulate loading or shape combined pickup behavior.",
    isActive: true,
  },
  {
    valueOhm: 1000000,
    valueLabel: "1M",
    wattage: "1/4W",
    tolerance: "5%",
    description: "High value resistor for specialty mods and bleed circuits.",
    isActive: false,
  },
];

const mods = [
  {
    name: "Coil Split Mod",
    slug: "coil-split-mod",
    description: "Lets a humbucker run as a single coil using a switching control.",
    requiresPushPull: true,
    requiresMiniToggle: false,
    requiresSpecialSwitch: false,
    difficultyLevel: "Intermediate",
    isActive: true,
  },
  {
    name: "Series Parallel Mod",
    slug: "series-parallel-mod",
    description: "Switches a humbucker between series and parallel wiring modes.",
    requiresPushPull: true,
    requiresMiniToggle: true,
    requiresSpecialSwitch: false,
    difficultyLevel: "Advanced",
    isActive: true,
  },
  {
    name: "Neck On Switch",
    slug: "neck-on-switch",
    description: "Adds the neck pickup into combinations not available on stock wiring.",
    requiresPushPull: false,
    requiresMiniToggle: true,
    requiresSpecialSwitch: false,
    difficultyLevel: "Intermediate",
    isActive: true,
  },
  {
    name: "Phase Reverse Mod",
    slug: "phase-reverse-mod",
    description: "Flips phase on one pickup for thin, nasal out-of-phase sounds.",
    requiresPushPull: false,
    requiresMiniToggle: false,
    requiresSpecialSwitch: true,
    difficultyLevel: "Advanced",
    isActive: false,
  },
];

const componentAssets = [
  {
    componentType: "Switch",
    name: "5-Way Blade Switch Top View",
    slug: "5-way-blade-switch-top-view",
    svgUrl: "/assets/components/switches/5-way-blade-top.svg",
    thumbnailUrl: "/assets/components/switches/5-way-blade-top-thumb.png",
    width: 320,
    height: 120,
    anchorPointsJson: [
      { key: "lug-1", x: 32, y: 24 },
      { key: "lug-8", x: 288, y: 96 },
    ],
    styleType: "Realistic",
    isActive: true,
  },
  {
    componentType: "Potentiometer",
    name: "250K Audio Pot Front",
    slug: "250k-audio-pot-front",
    svgUrl: "/assets/components/pots/250k-audio-front.svg",
    thumbnailUrl: "/assets/components/pots/250k-audio-front-thumb.png",
    width: 240,
    height: 240,
    anchorPointsJson: [
      { key: "lug-left", x: 56, y: 188 },
      { key: "lug-center", x: 120, y: 188 },
      { key: "lug-right", x: 184, y: 188 },
    ],
    styleType: "Illustrated",
    isActive: true,
  },
  {
    componentType: "Output Jack",
    name: "Mono Output Jack Side View",
    slug: "mono-output-jack-side-view",
    svgUrl: "/assets/components/jacks/mono-side.svg",
    thumbnailUrl: null,
    width: 260,
    height: 200,
    anchorPointsJson: [
      { key: "tip", x: 201, y: 66 },
      { key: "sleeve", x: 96, y: 154 },
    ],
    styleType: "Technical",
    isActive: true,
  },
  {
    componentType: "Pickup",
    name: "Humbucker Pickup Base",
    slug: "humbucker-pickup-base",
    svgUrl: "/assets/components/pickups/humbucker-base.svg",
    thumbnailUrl: "/assets/components/pickups/humbucker-base-thumb.png",
    width: 360,
    height: 140,
    anchorPointsJson: null,
    styleType: "Realistic",
    isActive: false,
  },
];

const componentConnectionPoints = [
  {
    componentAssetSlug: "5-way-blade-switch-top-view",
    pointKey: "lug-1",
    label: "Lug 1",
    pointType: "Lug",
    x: 32,
    y: 24,
    description: "First terminal on the upper switch pole.",
  },
  {
    componentAssetSlug: "5-way-blade-switch-top-view",
    pointKey: "common-a",
    label: "Common A",
    pointType: "Common",
    x: 164,
    y: 18,
    description: "Shared output terminal for the first pole.",
  },
  {
    componentAssetSlug: "250k-audio-pot-front",
    pointKey: "lug-left",
    label: "Lug Left",
    pointType: "Lug",
    x: 56,
    y: 188,
    description: "Outer terminal commonly tied to ground or input depending on role.",
  },
  {
    componentAssetSlug: "mono-output-jack-side-view",
    pointKey: "tip",
    label: "Tip",
    pointType: "Output",
    x: 201,
    y: 66,
    description: "Hot output terminal leading to the cable tip.",
  },
];

const wireTypes = [
  {
    name: "Hot Lead White",
    color: "White",
    hexColor: "#F5F5F5",
    wireFunction: "Hot",
    isShielded: false,
    isGround: false,
    description: "Common hot lead used for pickup output in many wiring schemes.",
  },
  {
    name: "Ground Black",
    color: "Black",
    hexColor: "#111111",
    wireFunction: "Ground",
    isShielded: false,
    isGround: true,
    description: "Standard ground wire for backs of pots and common returns.",
  },
  {
    name: "Shield Bare",
    color: "Bare",
    hexColor: "#B7B7B7",
    wireFunction: "Shield",
    isShielded: true,
    isGround: true,
    description: "Uninsulated braided or drain shield connected to ground.",
  },
  {
    name: "Battery Positive Red",
    color: "Red",
    hexColor: "#D62828",
    wireFunction: "Battery Positive",
    isShielded: false,
    isGround: false,
    description: "Power lead for active circuits and onboard preamps.",
  },
];

const wiringTemplates = [
  {
    name: "Strat Standard SSS 5-Way",
    slug: "strat-standard-sss-5-way",
    description: "Classic strat layout with master volume and two tone controls.",
    pickupConfigurationCode: "SSS",
    switchTypeSlug: "5-way-blade-switch",
    volumeCount: 1,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson: {
      components: [
        { id: "switch", type: "switch", ref: "5-way-blade-switch" },
        { id: "volume", type: "pot", role: "volume" },
      ],
      wires: [
        { from: "neck.hot", to: "switch.lug1", color: "white" },
        { from: "volume.output", to: "jack.tip", color: "white" },
      ],
    },
    switchLogicJson: {
      positions: [
        { index: 1, label: "Bridge" },
        { index: 2, label: "Bridge + Middle" },
        { index: 3, label: "Middle" },
        { index: 4, label: "Middle + Neck" },
        { index: 5, label: "Neck" },
      ],
    },
    isVerified: true,
    sourceType: "Reference",
    sourceUrl: "https://example.com/strat-standard-sss-5-way",
    createdBy: "System Seed",
  },
  {
    name: "Les Paul HH 3-Way",
    slug: "les-paul-hh-3-way",
    description: "Traditional dual-humbucker wiring with two volume and two tone controls.",
    pickupConfigurationCode: "HH",
    switchTypeSlug: "3-way-toggle-switch",
    volumeCount: 2,
    toneCount: 2,
    difficultyLevel: "Intermediate",
    diagramJson: {
      components: [
        { id: "toggle", type: "switch", ref: "3-way-toggle-switch" },
        { id: "neck-volume", type: "pot", role: "volume" },
      ],
      wires: [
        { from: "neck.hot", to: "toggle.neck", color: "white" },
        { from: "bridge.hot", to: "toggle.bridge", color: "white" },
      ],
    },
    switchLogicJson: {
      positions: [
        { index: 1, label: "Neck" },
        { index: 2, label: "Neck + Bridge" },
        { index: 3, label: "Bridge" },
      ],
    },
    isVerified: false,
    sourceType: "Imported",
    sourceUrl: "https://example.com/les-paul-hh-3-way",
    createdBy: "System Seed",
  },
];

const wiringTemplateComponents = [
  {
    wiringTemplateSlug: "strat-standard-sss-5-way",
    componentRole: "Switch",
    componentType: "Switch",
    assetSlug: "5-way-blade-switch-top-view",
    positionX: 428,
    positionY: 126,
    rotation: 0,
    metadataJson: {
      label: "5-Way Blade Switch",
      layer: "controls",
    },
  },
  {
    wiringTemplateSlug: "strat-standard-sss-5-way",
    componentRole: "Volume",
    componentType: "Potentiometer",
    assetSlug: "250k-audio-pot-front",
    positionX: 612,
    positionY: 298,
    rotation: 0,
    metadataJson: {
      label: "Master Volume",
      layer: "controls",
    },
  },
  {
    wiringTemplateSlug: "les-paul-hh-3-way",
    componentRole: "Selector",
    componentType: "Switch",
    assetSlug: "5-way-blade-switch-top-view",
    positionX: 188,
    positionY: 92,
    rotation: 90,
    metadataJson: {
      label: "3-Way Selector Placement Placeholder",
      layer: "controls",
    },
  },
];

const wiringTemplateConnections = [
  {
    wiringTemplateSlug: "strat-standard-sss-5-way",
    fromComponentRole: "Switch",
    fromPointKey: "lug-1",
    toComponentRole: "Volume",
    toPointKey: "input",
    wireTypeName: "Hot Lead White",
    wireColor: "White",
    pathJson: {
      points: [
        { x: 428, y: 126 },
        { x: 520, y: 180 },
        { x: 612, y: 298 },
      ],
    },
    label: "Switch to Volume",
    notes: "Primary hot signal path from selector to master volume.",
  },
  {
    wiringTemplateSlug: "les-paul-hh-3-way",
    fromComponentRole: "Selector",
    fromPointKey: "output",
    toComponentRole: "Volume",
    toPointKey: "input",
    wireTypeName: "Hot Lead White",
    wireColor: "White",
    pathJson: {
      points: [
        { x: 188, y: 92 },
        { x: 260, y: 168 },
        { x: 344, y: 244 },
      ],
    },
    label: "Selector Out",
    notes: "Routes selected pickup signal to the volume control.",
  },
];

for (const user of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  });
}

for (const brand of brands) {
  await prisma.brand.upsert({
    where: { slug: brand.slug },
    update: brand,
    create: brand,
  });
}

for (const pickupType of pickupTypes) {
  await prisma.pickupType.upsert({
    where: { slug: pickupType.slug },
    update: pickupType,
    create: pickupType,
  });
}

for (const pickupModel of pickupModels) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { slug: pickupModel.brandSlug },
    select: { id: true },
  });
  const pickupType = await prisma.pickupType.findUniqueOrThrow({
    where: { slug: pickupModel.pickupTypeSlug },
    select: { id: true },
  });

  await prisma.pickupModel.upsert({
    where: { slug: pickupModel.slug },
    update: {
      pickupBrandId: brand.id,
      pickupTypeId: pickupType.id,
      name: pickupModel.name,
      positionType: pickupModel.positionType,
      wireCount: pickupModel.wireCount,
      magnetType: pickupModel.magnetType,
      dcResistance: pickupModel.dcResistance,
      outputLevel: pickupModel.outputLevel,
      isActivePickup: pickupModel.isActivePickup,
      colorCodeSchemaId: pickupModel.colorCodeSchemaId,
      description: pickupModel.description,
    },
    create: {
      pickupBrandId: brand.id,
      pickupTypeId: pickupType.id,
      name: pickupModel.name,
      slug: pickupModel.slug,
      positionType: pickupModel.positionType,
      wireCount: pickupModel.wireCount,
      magnetType: pickupModel.magnetType,
      dcResistance: pickupModel.dcResistance,
      outputLevel: pickupModel.outputLevel,
      isActivePickup: pickupModel.isActivePickup,
      colorCodeSchemaId: pickupModel.colorCodeSchemaId,
      description: pickupModel.description,
    },
  });
}

for (const guitarBrand of guitarBrands) {
  await prisma.guitarBrand.upsert({
    where: { slug: guitarBrand.slug },
    update: guitarBrand,
    create: guitarBrand,
  });
}

for (const guitarModel of guitarModels) {
  const guitarBrand = await prisma.guitarBrand.findUniqueOrThrow({
    where: { slug: guitarModel.guitarBrandSlug },
    select: { id: true },
  });

  await prisma.guitarModel.upsert({
    where: { slug: guitarModel.slug },
    update: {
      guitarBrandId: guitarBrand.id,
      name: guitarModel.name,
      series: guitarModel.series,
      yearStart: guitarModel.yearStart,
      yearEnd: guitarModel.yearEnd,
      bodyType: guitarModel.bodyType,
      defaultPickupConfig: guitarModel.defaultPickupConfig,
      description: guitarModel.description,
      isActive: guitarModel.isActive,
    },
    create: {
      guitarBrandId: guitarBrand.id,
      name: guitarModel.name,
      slug: guitarModel.slug,
      series: guitarModel.series,
      yearStart: guitarModel.yearStart,
      yearEnd: guitarModel.yearEnd,
      bodyType: guitarModel.bodyType,
      defaultPickupConfig: guitarModel.defaultPickupConfig,
      description: guitarModel.description,
      isActive: guitarModel.isActive,
    },
  });
}

for (const schema of wireColorSchemas) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { slug: schema.brandSlug },
    select: { id: true },
  });
  const pickupType = await prisma.pickupType.findUniqueOrThrow({
    where: { slug: schema.pickupTypeSlug },
    select: { id: true },
  });

  await prisma.wireColorSchema.upsert({
    where: {
      id: `${schema.brandSlug}-${schema.pickupTypeSlug}-${schema.name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: {
      pickupBrandId: brand.id,
      name: schema.name,
      pickupTypeId: pickupType.id,
      hotColor: schema.hotColor,
      groundColor: schema.groundColor,
      shieldColor: schema.shieldColor,
      northStartColor: schema.northStartColor,
      northFinishColor: schema.northFinishColor,
      southStartColor: schema.southStartColor,
      southFinishColor: schema.southFinishColor,
      batteryPositiveColor: schema.batteryPositiveColor,
      batteryNegativeColor: schema.batteryNegativeColor,
      notes: schema.notes,
    },
    create: {
      id: `${schema.brandSlug}-${schema.pickupTypeSlug}-${schema.name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      pickupBrandId: brand.id,
      name: schema.name,
      pickupTypeId: pickupType.id,
      hotColor: schema.hotColor,
      groundColor: schema.groundColor,
      shieldColor: schema.shieldColor,
      northStartColor: schema.northStartColor,
      northFinishColor: schema.northFinishColor,
      southStartColor: schema.southStartColor,
      southFinishColor: schema.southFinishColor,
      batteryPositiveColor: schema.batteryPositiveColor,
      batteryNegativeColor: schema.batteryNegativeColor,
      notes: schema.notes,
    },
  });
}

for (const configuration of pickupConfigurations) {
  await prisma.pickupConfiguration.upsert({
    where: { code: configuration.code },
    update: configuration,
    create: configuration,
  });
}

for (const switchType of switchTypes) {
  await prisma.switchType.upsert({
    where: { slug: switchType.slug },
    update: switchType,
    create: switchType,
  });
}

for (const potType of potTypes) {
  await prisma.potType.upsert({
    where: {
      id: `${potType.name}-${potType.valueLabel}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: potType,
    create: {
      id: `${potType.name}-${potType.valueLabel}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ...potType,
    },
  });
}

for (const capacitor of capacitors) {
  await prisma.capacitor.upsert({
    where: {
      id: `${capacitor.valueLabel}-${capacitor.type ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: capacitor,
    create: {
      id: `${capacitor.valueLabel}-${capacitor.type ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ...capacitor,
    },
  });
}

for (const resistor of resistors) {
  await prisma.resistor.upsert({
    where: {
      id: `${resistor.valueLabel}-${resistor.wattage ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: resistor,
    create: {
      id: `${resistor.valueLabel}-${resistor.wattage ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ...resistor,
    },
  });
}

for (const mod of mods) {
  await prisma.mod.upsert({
    where: { slug: mod.slug },
    update: mod,
    create: mod,
  });
}

for (const componentAsset of componentAssets) {
  await prisma.componentAsset.upsert({
    where: { slug: componentAsset.slug },
    update: componentAsset,
    create: componentAsset,
  });
}

for (const point of componentConnectionPoints) {
  const componentAsset = await prisma.componentAsset.findUniqueOrThrow({
    where: { slug: point.componentAssetSlug },
    select: { id: true },
  });

  await prisma.componentConnectionPoint.upsert({
    where: {
      componentAssetId_pointKey: {
        componentAssetId: componentAsset.id,
        pointKey: point.pointKey,
      },
    },
    update: {
      label: point.label,
      pointType: point.pointType,
      x: point.x,
      y: point.y,
      description: point.description,
    },
    create: {
      componentAssetId: componentAsset.id,
      pointKey: point.pointKey,
      label: point.label,
      pointType: point.pointType,
      x: point.x,
      y: point.y,
      description: point.description,
    },
  });
}

for (const wireType of wireTypes) {
  await prisma.wireType.upsert({
    where: {
      id: `${wireType.name}-${wireType.color ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: wireType,
    create: {
      id: `${wireType.name}-${wireType.color ?? "generic"}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ...wireType,
    },
  });
}

for (const template of wiringTemplates) {
  const pickupConfiguration = await prisma.pickupConfiguration.findUniqueOrThrow({
    where: { code: template.pickupConfigurationCode },
    select: { id: true },
  });
  const switchType = await prisma.switchType.findUniqueOrThrow({
    where: { slug: template.switchTypeSlug },
    select: { id: true },
  });

  await prisma.wiringTemplate.upsert({
    where: { slug: template.slug },
    update: {
      name: template.name,
      description: template.description,
      pickupConfigurationId: pickupConfiguration.id,
      switchTypeId: switchType.id,
      volumeCount: template.volumeCount,
      toneCount: template.toneCount,
      difficultyLevel: template.difficultyLevel,
      diagramJson: template.diagramJson,
      switchLogicJson: template.switchLogicJson,
      isVerified: template.isVerified,
      sourceType: template.sourceType,
      sourceUrl: template.sourceUrl,
      createdBy: template.createdBy,
    },
    create: {
      name: template.name,
      slug: template.slug,
      description: template.description,
      pickupConfigurationId: pickupConfiguration.id,
      switchTypeId: switchType.id,
      volumeCount: template.volumeCount,
      toneCount: template.toneCount,
      difficultyLevel: template.difficultyLevel,
      diagramJson: template.diagramJson,
      switchLogicJson: template.switchLogicJson,
      isVerified: template.isVerified,
      sourceType: template.sourceType,
      sourceUrl: template.sourceUrl,
      createdBy: template.createdBy,
    },
  });
}

for (const component of wiringTemplateComponents) {
  const wiringTemplate = await prisma.wiringTemplate.findUniqueOrThrow({
    where: { slug: component.wiringTemplateSlug },
    select: { id: true },
  });
  const asset = await prisma.componentAsset.findUniqueOrThrow({
    where: { slug: component.assetSlug },
    select: { id: true },
  });

  await prisma.wiringTemplateComponent.upsert({
    where: {
      id: `${component.wiringTemplateSlug}-${component.componentRole}-${component.assetSlug}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: {
      wiringTemplateId: wiringTemplate.id,
      componentRole: component.componentRole,
      componentType: component.componentType,
      assetId: asset.id,
      positionX: component.positionX,
      positionY: component.positionY,
      rotation: component.rotation,
      metadataJson: component.metadataJson,
    },
    create: {
      id: `${component.wiringTemplateSlug}-${component.componentRole}-${component.assetSlug}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      wiringTemplateId: wiringTemplate.id,
      componentRole: component.componentRole,
      componentType: component.componentType,
      assetId: asset.id,
      positionX: component.positionX,
      positionY: component.positionY,
      rotation: component.rotation,
      metadataJson: component.metadataJson,
    },
  });
}

for (const connection of wiringTemplateConnections) {
  const wiringTemplate = await prisma.wiringTemplate.findUniqueOrThrow({
    where: { slug: connection.wiringTemplateSlug },
    select: { id: true },
  });
  const wireType = await prisma.wireType.findFirstOrThrow({
    where: { name: connection.wireTypeName },
    select: { id: true },
  });

  await prisma.wiringTemplateConnection.upsert({
    where: {
      id: `${connection.wiringTemplateSlug}-${connection.fromComponentRole}-${connection.fromPointKey}-${connection.toComponentRole}-${connection.toPointKey}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: {
      wiringTemplateId: wiringTemplate.id,
      fromComponentRole: connection.fromComponentRole,
      fromPointKey: connection.fromPointKey,
      toComponentRole: connection.toComponentRole,
      toPointKey: connection.toPointKey,
      wireTypeId: wireType.id,
      wireColor: connection.wireColor,
      pathJson: connection.pathJson,
      label: connection.label,
      notes: connection.notes,
    },
    create: {
      id: `${connection.wiringTemplateSlug}-${connection.fromComponentRole}-${connection.fromPointKey}-${connection.toComponentRole}-${connection.toPointKey}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      wiringTemplateId: wiringTemplate.id,
      fromComponentRole: connection.fromComponentRole,
      fromPointKey: connection.fromPointKey,
      toComponentRole: connection.toComponentRole,
      toPointKey: connection.toPointKey,
      wireTypeId: wireType.id,
      wireColor: connection.wireColor,
      pathJson: connection.pathJson,
      label: connection.label,
      notes: connection.notes,
    },
  });
}

await prisma.$disconnect();
