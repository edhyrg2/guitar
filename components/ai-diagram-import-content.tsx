"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiIdeaIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  DatabaseSync01Icon,
  FileImportIcon,
  InformationCircleIcon,
  NoteIcon,
  Sorting01Icon,
  SearchList01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSelect } from "@/components/ui/app-select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  type ComponentAssetRow,
} from "@/lib/component-asset-types";
import {
  type ComponentConnectionPointRow,
} from "@/lib/component-connection-point-types";
import { type PickupConfigurationRow } from "@/lib/pickup-configuration-types";
import { type SwitchTypeRow } from "@/lib/switch-type-types";
import { cn } from "@/lib/utils";
import { type WireTypeRow } from "@/lib/wire-type-types";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";

type AiDiagramImportContentProps = {
  pickupConfigurations: PickupConfigurationRow[];
  switchTypes: SwitchTypeRow[];
  componentAssets: ComponentAssetRow[];
  connectionPoints: ComponentConnectionPointRow[];
  wireTypes: WireTypeRow[];
};

type BuilderForm = {
  templateName: string;
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  difficultyLevel: string;
  sourceType: string;
  sourceUrl: string;
  createdBy: string;
  importNotes: string;
};

type ValidationState = {
  errors: string[];
  warnings: string[];
  normalizedJson: string | null;
};

type ImportState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

type PromptPayload = {
  template: {
    name: string;
    slug: string;
    description: string;
    pickupConfigurationCode: string;
    switchTypeSlug: string;
    volumeCount: number;
    toneCount: number;
    difficultyLevel: string;
    sourceType: string;
    sourceUrl: string;
    createdBy: string;
    isVerified: boolean;
  };
  diagramJson: {
    summary: string;
    components: Array<{
      id: string;
      type: string;
      role: string;
      assetSlug: string;
      label: string;
    }>;
    wires: Array<{
      from: string;
      to: string;
      wireTypeName: string;
      color: string;
    }>;
  };
  switchLogicJson: {
    positions: Array<{
      index: number;
      label: string;
      activePickups: string[];
      notes: string;
    }>;
  };
  components: Array<{
    componentRole: string;
    componentType: string;
    assetSlug: string;
    positionX: number;
    positionY: number;
    rotation: number;
    metadataJson: {
      label: string;
      layer: string;
      notes: string;
    };
  }>;
  connections: Array<{
    fromComponentRole: string;
    fromPointKey: string;
    toComponentRole: string;
    toPointKey: string;
    wireTypeName: string;
    wireColor: string;
    label: string;
    notes: string;
    pathJson: {
      points: Array<{
        x: number;
        y: number;
      }>;
    };
  }>;
};

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30";

const sectionLabelClassName =
  "text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function safeJsonStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function resolvePickupConfiguration(
  pickupConfigurations: PickupConfigurationRow[],
  rawValue: string | undefined
) {
  const normalized = normalizeValue(rawValue);

  return pickupConfigurations.find(
    (item) =>
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.code) === normalized ||
      normalizeValue(item.name) === normalized
  );
}

function resolveSwitchType(switchTypes: SwitchTypeRow[], rawValue: string | undefined) {
  const normalized = normalizeValue(rawValue);

  return switchTypes.find(
    (item) =>
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.slug) === normalized ||
      normalizeValue(item.name) === normalized
  );
}

function resolveAsset(componentAssets: ComponentAssetRow[], rawValue: {
  assetId?: string;
  assetSlug?: string;
  assetName?: string;
}) {
  const candidates = [rawValue.assetId, rawValue.assetSlug, rawValue.assetName]
    .map((item) => normalizeValue(item))
    .filter(Boolean);

  return componentAssets.find((item) =>
    candidates.some(
      (candidate) =>
        normalizeValue(item.id) === candidate ||
        normalizeValue(item.slug) === candidate ||
        normalizeValue(item.name) === candidate
    )
  );
}

function resolveWireType(wireTypes: WireTypeRow[], rawValue: {
  wireTypeId?: string;
  wireTypeName?: string;
}) {
  const candidates = [rawValue.wireTypeId, rawValue.wireTypeName]
    .map((item) => normalizeValue(item))
    .filter(Boolean);

  return wireTypes.find((item) =>
    candidates.some(
      (candidate) =>
        normalizeValue(item.id) === candidate || normalizeValue(item.name) === candidate
    )
  );
}

function buildExpectedPayload(form: BuilderForm, switchType: SwitchTypeRow | undefined) {
  const positionCount = switchType?.positionCount ?? 3;

  const payload: PromptPayload = {
    template: {
      name: form.templateName || "Example Wiring Template",
      slug: slugify(form.templateName || "example-wiring-template"),
      description: "Short technical description of the wiring diagram.",
      pickupConfigurationCode: "SSS",
      switchTypeSlug: switchType?.slug ?? "5-way-blade-switch",
      volumeCount: form.volumeCount,
      toneCount: form.toneCount,
      difficultyLevel: form.difficultyLevel || "Intermediate",
      sourceType: form.sourceType || "AI Import",
      sourceUrl: form.sourceUrl || "https://example.com/source-diagram",
      createdBy: form.createdBy || "AI Import",
      isVerified: false,
    },
    diagramJson: {
      summary: "One paragraph summary of the signal flow.",
      components: [
        {
          id: "switch-main",
          type: "Switch",
          role: "Switch",
          assetSlug: "5-way-blade-switch-top-view",
          label: "Main selector",
        },
      ],
      wires: [
        {
          from: "NeckPickup.hot",
          to: "Switch.lug-1",
          wireTypeName: "Hot Lead White",
          color: "White",
        },
      ],
    },
    switchLogicJson: {
      positions: Array.from({ length: positionCount }, (_, index) => ({
        index: index + 1,
        label: `Position ${index + 1}`,
        activePickups: ["Bridge"],
        notes: "Describe what this switch position connects.",
      })),
    },
    components: [
      {
        componentRole: "Switch",
        componentType: "Switch",
        assetSlug: "5-way-blade-switch-top-view",
        positionX: 420,
        positionY: 120,
        rotation: 0,
        metadataJson: {
          label: "Main selector",
          layer: "controls",
          notes: "Use an allowed asset slug from the provided catalog.",
        },
      },
    ],
    connections: [
      {
        fromComponentRole: "Switch",
        fromPointKey: "lug-1",
        toComponentRole: "Volume",
        toPointKey: "lug-left",
        wireTypeName: "Hot Lead White",
        wireColor: "White",
        label: "Switch to volume",
        notes: "Every point key must exist on the referenced component asset.",
        pathJson: {
          points: [
            { x: 420, y: 120 },
            { x: 540, y: 220 },
            { x: 620, y: 300 },
          ],
        },
      },
    ],
  };

  return safeJsonStringify(payload);
}

function buildPrompt(args: {
  form: BuilderForm;
  pickupConfiguration: PickupConfigurationRow | undefined;
  switchType: SwitchTypeRow | undefined;
  componentAssets: ComponentAssetRow[];
  connectionPoints: ComponentConnectionPointRow[];
  wireTypes: WireTypeRow[];
  expectedSchema: string;
}) {
  const {
    form,
    pickupConfiguration,
    switchType,
    componentAssets,
    connectionPoints,
    wireTypes,
    expectedSchema,
  } = args;

  const activeAssets = componentAssets.filter((item) => item.isActive);

  const assetReference = activeAssets.map((asset) => {
    const points = connectionPoints
      .filter((point) => point.componentAssetId === asset.id)
      .map((point) => `${point.pointKey} (${point.label})`)
      .join(", ");

    return `- ${asset.name} | slug: ${asset.slug ?? "-"} | type: ${asset.componentType} | points: ${points || "none registered"}`;
  });

  const wireReference = wireTypes.map((wire) => {
    const tags = [
      wire.color ? `color ${wire.color}` : null,
      wire.wireFunction ? `function ${wire.wireFunction}` : null,
      wire.isGround ? "ground" : null,
      wire.isShielded ? "shielded" : null,
    ]
      .filter(Boolean)
      .join(", ");

    return `- ${wire.name}${tags ? ` | ${tags}` : ""}`;
  });

  const checklist = [
    "1. Read the source wiring diagram carefully before responding.",
    "2. Use only values from the provided master data.",
    "3. Do not invent asset slugs, point keys, wire type names, pickup codes, or switch slugs.",
    "4. Return JSON only. No markdown, no explanation, no code fence.",
    "5. If something is unclear, keep the field as the closest valid match and explain it inside notes fields.",
  ].join("\n");

  return [
    "You are helping convert a guitar wiring diagram into a structured JSON payload for an internal import tool.",
    "",
    "Target template metadata:",
    `- Template name: ${form.templateName || "Untitled template"}`,
    `- Pickup configuration: ${pickupConfiguration?.name ?? "Not selected"} (${pickupConfiguration?.code ?? "-"})`,
    `- Switch type: ${switchType?.name ?? "Not selected"} (${switchType?.slug ?? "-"})`,
    `- Volume count: ${form.volumeCount}`,
    `- Tone count: ${form.toneCount}`,
    `- Difficulty level: ${form.difficultyLevel || "Intermediate"}`,
    `- Source type: ${form.sourceType || "AI Import"}`,
    `- Source URL: ${form.sourceUrl || "N/A"}`,
    `- Created by: ${form.createdBy || "AI Import"}`,
    "",
    "Additional notes from operator:",
    form.importNotes || "-",
    "",
    "Allowed component assets and point keys:",
    assetReference.join("\n"),
    "",
    "Allowed wire types:",
    wireReference.join("\n"),
    "",
    "Rules:",
    checklist,
    "",
    "Expected output schema:",
    expectedSchema,
  ].join("\n");
}

function validateImportPayload(args: {
  rawValue: string;
  pickupConfigurations: PickupConfigurationRow[];
  switchTypes: SwitchTypeRow[];
  componentAssets: ComponentAssetRow[];
  connectionPoints: ComponentConnectionPointRow[];
  wireTypes: WireTypeRow[];
}): ValidationState {
  const {
    rawValue,
    pickupConfigurations,
    switchTypes,
    componentAssets,
    connectionPoints,
    wireTypes,
  } = args;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawValue.trim()) {
    return {
      errors: ["Paste JSON output from ChatGPT before validating."],
      warnings,
      normalizedJson: null,
    };
  }

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(rawValue) as Record<string, unknown>;
  } catch {
    return {
      errors: ["Output is not valid JSON."],
      warnings,
      normalizedJson: null,
    };
  }

  const template = parsed.template as Record<string, unknown> | undefined;
  const diagramJson = parsed.diagramJson;
  const switchLogicJson = parsed.switchLogicJson;
  const components = Array.isArray(parsed.components) ? parsed.components : [];
  const connections = Array.isArray(parsed.connections) ? parsed.connections : [];

  if (!template) {
    errors.push("Missing root.template.");
  }

  if (!diagramJson || typeof diagramJson !== "object") {
    errors.push("Missing root.diagramJson object.");
  }

  if (!switchLogicJson || typeof switchLogicJson !== "object") {
    errors.push("Missing root.switchLogicJson object.");
  }

  if (!Array.isArray(parsed.components)) {
    errors.push("Missing root.components array.");
  }

  if (!Array.isArray(parsed.connections)) {
    errors.push("Missing root.connections array.");
  }

  const resolvedPickupConfiguration = resolvePickupConfiguration(
    pickupConfigurations,
    typeof template?.pickupConfigurationCode === "string"
      ? template.pickupConfigurationCode
      : undefined
  );

  if (!resolvedPickupConfiguration) {
    errors.push("pickupConfigurationCode does not match master data.");
  }

  const resolvedSwitchType = resolveSwitchType(
    switchTypes,
    typeof template?.switchTypeSlug === "string" ? template.switchTypeSlug : undefined
  );

  if (!resolvedSwitchType) {
    errors.push("switchTypeSlug does not match master data.");
  }

  const normalizedComponents: Array<Record<string, unknown>> = [];
  const componentRoleMap = new Map<
    string,
    { componentRole: string; componentType: string; assetId: string; assetName: string }
  >();

  components.forEach((item, index) => {
    const component = item as Record<string, unknown>;
    const componentRole =
      typeof component.componentRole === "string" ? component.componentRole.trim() : "";
    const componentType =
      typeof component.componentType === "string" ? component.componentType.trim() : "";

    if (!componentRole) {
      errors.push(`components[${index}].componentRole is required.`);
      return;
    }

    if (!componentType) {
      errors.push(`components[${index}].componentType is required.`);
      return;
    }

    const asset = resolveAsset(componentAssets, {
      assetId: typeof component.assetId === "string" ? component.assetId : undefined,
      assetSlug: typeof component.assetSlug === "string" ? component.assetSlug : undefined,
      assetName: typeof component.assetName === "string" ? component.assetName : undefined,
    });

    if (!asset) {
      errors.push(`components[${index}] does not match any known component asset.`);
      return;
    }

    if (!asset.isActive) {
      warnings.push(`components[${index}] matched inactive asset "${asset.name}".`);
    }

    const positionX =
      typeof component.positionX === "number" ? component.positionX : Number.NaN;
    const positionY =
      typeof component.positionY === "number" ? component.positionY : Number.NaN;
    const rotation =
      typeof component.rotation === "number" ? component.rotation : Number.NaN;

    if (!Number.isFinite(positionX) || !Number.isFinite(positionY)) {
      errors.push(`components[${index}] must contain numeric positionX and positionY.`);
      return;
    }

    if (!Number.isFinite(rotation)) {
      errors.push(`components[${index}].rotation must be numeric.`);
      return;
    }

    componentRoleMap.set(normalizeValue(componentRole), {
      componentRole,
      componentType,
      assetId: asset.id,
      assetName: asset.name,
    });

    normalizedComponents.push({
      componentRole,
      componentType,
      assetId: asset.id,
      assetName: asset.name,
      positionX,
      positionY,
      rotation,
      metadataJson:
        component.metadataJson && typeof component.metadataJson === "object"
          ? component.metadataJson
          : null,
    });
  });

  const normalizedConnections: Array<Record<string, unknown>> = [];

  connections.forEach((item, index) => {
    const connection = item as Record<string, unknown>;
    const fromRole =
      typeof connection.fromComponentRole === "string"
        ? connection.fromComponentRole.trim()
        : "";
    const toRole =
      typeof connection.toComponentRole === "string"
        ? connection.toComponentRole.trim()
        : "";
    const fromPointKey =
      typeof connection.fromPointKey === "string" ? connection.fromPointKey.trim() : "";
    const toPointKey =
      typeof connection.toPointKey === "string" ? connection.toPointKey.trim() : "";

    if (!fromRole || !toRole || !fromPointKey || !toPointKey) {
      errors.push(
        `connections[${index}] requires fromComponentRole, fromPointKey, toComponentRole, and toPointKey.`
      );
      return;
    }

    const fromComponent = componentRoleMap.get(normalizeValue(fromRole));
    const toComponent = componentRoleMap.get(normalizeValue(toRole));

    if (!fromComponent) {
      errors.push(`connections[${index}] references unknown fromComponentRole "${fromRole}".`);
      return;
    }

    if (!toComponent) {
      errors.push(`connections[${index}] references unknown toComponentRole "${toRole}".`);
      return;
    }

    const fromPointExists = connectionPoints.some(
      (point) =>
        point.componentAssetId === fromComponent.assetId &&
        normalizeValue(point.pointKey) === normalizeValue(fromPointKey)
    );
    const toPointExists = connectionPoints.some(
      (point) =>
        point.componentAssetId === toComponent.assetId &&
        normalizeValue(point.pointKey) === normalizeValue(toPointKey)
    );

    if (!fromPointExists) {
      errors.push(
        `connections[${index}] point "${fromPointKey}" is not registered for asset "${fromComponent.assetName}".`
      );
      return;
    }

    if (!toPointExists) {
      errors.push(
        `connections[${index}] point "${toPointKey}" is not registered for asset "${toComponent.assetName}".`
      );
      return;
    }

    const wireType = resolveWireType(wireTypes, {
      wireTypeId:
        typeof connection.wireTypeId === "string" ? connection.wireTypeId : undefined,
      wireTypeName:
        typeof connection.wireTypeName === "string"
          ? connection.wireTypeName
          : undefined,
    });

    if (!wireType) {
      errors.push(`connections[${index}] does not match any known wire type.`);
      return;
    }

    const pathJson =
      connection.pathJson && typeof connection.pathJson === "object"
        ? connection.pathJson
        : null;

    normalizedConnections.push({
      fromComponentRole: fromRole,
      fromPointKey,
      toComponentRole: toRole,
      toPointKey,
      wireTypeId: wireType.id,
      wireTypeName: wireType.name,
      wireColor:
        typeof connection.wireColor === "string" ? connection.wireColor.trim() : null,
      label: typeof connection.label === "string" ? connection.label.trim() : null,
      notes: typeof connection.notes === "string" ? connection.notes.trim() : null,
      pathJson,
    });
  });

  if (!errors.length && normalizedConnections.length === 0) {
    warnings.push("No valid connections were found in the payload.");
  }

  const normalizedPayload = !errors.length
    ? {
        template: {
          name: typeof template?.name === "string" ? template.name.trim() : "",
          slug:
            typeof template?.slug === "string" && template.slug.trim()
              ? template.slug.trim()
              : slugify(typeof template?.name === "string" ? template.name : "ai-import"),
          description:
            typeof template?.description === "string"
              ? template.description.trim()
              : null,
          pickupConfigurationId: resolvedPickupConfiguration?.id ?? null,
          switchTypeId: resolvedSwitchType?.id ?? null,
          volumeCount:
            typeof template?.volumeCount === "number" ? template.volumeCount : 0,
          toneCount: typeof template?.toneCount === "number" ? template.toneCount : 0,
          difficultyLevel:
            typeof template?.difficultyLevel === "string"
              ? template.difficultyLevel.trim()
              : null,
          sourceType:
            typeof template?.sourceType === "string" ? template.sourceType.trim() : null,
          sourceUrl:
            typeof template?.sourceUrl === "string" ? template.sourceUrl.trim() : null,
          createdBy:
            typeof template?.createdBy === "string" ? template.createdBy.trim() : "AI Import",
          isVerified: Boolean(template?.isVerified),
        },
        diagramJson,
        switchLogicJson,
        components: normalizedComponents,
        connections: normalizedConnections,
      }
    : null;

  return {
    errors,
    warnings,
    normalizedJson: normalizedPayload ? safeJsonStringify(normalizedPayload) : null,
  };
}

export function AiDiagramImportContent({
  pickupConfigurations,
  switchTypes,
  componentAssets,
  connectionPoints,
  wireTypes,
}: AiDiagramImportContentProps) {
  const [form, setForm] = React.useState<BuilderForm>({
    templateName: "AI Imported Wiring Template",
    pickupConfigurationId: pickupConfigurations[0]?.id ?? "",
    switchTypeId: switchTypes[0]?.id ?? "",
    volumeCount: 1,
    toneCount: 1,
    difficultyLevel: "Intermediate",
    sourceType: "AI Import",
    sourceUrl: "",
    createdBy: "ChatGPT Import",
    importNotes:
      "Match only against registered master data. If the source diagram is ambiguous, explain the assumption inside notes fields.",
  });
  const [aiOutput, setAiOutput] = React.useState("");
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const [validation, setValidation] = React.useState<ValidationState>({
    errors: [],
    warnings: [],
    normalizedJson: null,
  });
  const [importState, setImportState] = React.useState<ImportState>({
    status: "idle",
    message: null,
  });
  const [importing, setImporting] = React.useState(false);

  const selectedPickupConfiguration = pickupConfigurations.find(
    (item) => item.id === form.pickupConfigurationId
  );
  const selectedSwitchType = switchTypes.find((item) => item.id === form.switchTypeId);
  const expectedSchema = buildExpectedPayload(form, selectedSwitchType);
  const promptText = buildPrompt({
    form,
    pickupConfiguration: selectedPickupConfiguration,
    switchType: selectedSwitchType,
    componentAssets,
    connectionPoints,
    wireTypes,
    expectedSchema,
  });

  function updateField<K extends keyof BuilderForm>(key: K, value: BuilderForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(promptText);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  function loadExampleOutput() {
    setAiOutput(expectedSchema);
    setValidation({
      errors: [],
      warnings: [],
      normalizedJson: null,
    });
    setImportState({
      status: "idle",
      message: null,
    });
  }

  function handleValidate() {
    setImportState({
      status: "idle",
      message: null,
    });
    setValidation(
      validateImportPayload({
        rawValue: aiOutput,
        pickupConfigurations,
        switchTypes,
        componentAssets,
        connectionPoints,
        wireTypes,
      })
    );
  }

  async function handleImport() {
    if (!validation.normalizedJson || validation.errors.length) {
      setImportState({
        status: "error",
        message: "Validate the AI output first and resolve all errors before importing.",
      });
      return;
    }

    setImporting(true);
    setImportState({
      status: "idle",
      message: null,
    });

    try {
      const response = await fetch("/api/ai-diagram-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: validation.normalizedJson,
      });

      const payload = (await response.json()) as {
        error?: string;
        template?: {
          name: string;
        };
        importedCounts?: {
          components: number;
          connections: number;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to import AI diagram.");
      }

      setImportState({
        status: "success",
        message: `Template "${payload.template?.name ?? "Untitled"}" imported with ${payload.importedCounts?.components ?? 0} components and ${payload.importedCounts?.connections ?? 0} connections.`,
      });
    } catch (error) {
      setImportState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to import AI diagram.",
      });
    } finally {
      setImporting(false);
    }
  }

  const activeAssets = componentAssets.filter((item) => item.isActive);
  const stats = [
    {
      title: "Reference assets",
      value: String(activeAssets.length),
      change: `${connectionPoints.length} registered points`,
      detail: "used to match component roles",
      icon: Sorting01Icon,
    },
    {
      title: "Wire definitions",
      value: String(wireTypes.length),
      change: "ground, hot, shield, power",
      detail: "must match output exactly",
      icon: DatabaseSync01Icon,
    },
    {
      title: "Import readiness",
      value: validation.errors.length ? "Review" : "Ready",
      change: `${validation.errors.length} errors / ${validation.warnings.length} warnings`,
      detail: "validation controls import",
      icon: CheckmarkCircle02Icon,
    },
  ];
  const workflowSteps = [
    {
      title: "Set context",
      detail: "Choose pickup config, switch logic, counts, and source notes.",
      icon: NoteIcon,
    },
    {
      title: "Send prompt",
      detail: "Copy the generated prompt and use it with ChatGPT plus your diagram source.",
      icon: SparklesIcon,
    },
    {
      title: "Validate import",
      detail: "Paste the JSON result so the system can match assets, points, and wires.",
      icon: SearchList01Icon,
    },
    {
      title: "Save to system",
      detail: "Import the normalized payload into wiring template tables.",
      icon: FileImportIcon,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardContent className="px-0">
            <div className="flex flex-col gap-6 bg-gradient-to-br from-card via-card to-muted/40 px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="mb-3 flex items-center gap-2">
                    <StatusPill label="AI Workflow" tone="primary" />
                    <span className={sectionLabelClassName}>Diagram Conversion</span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Import wiring diagrams with a clearer AI-to-system flow
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Halaman ini menyiapkan prompt, memberi batasan master data, lalu
                    mengecek hasil ChatGPT sebelum data benar-benar masuk ke template
                    wiring di sistem.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-sm backdrop-blur">
                  <div className={sectionLabelClassName}>Current State</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <HugeiconsIcon icon={validation.errors.length ? InformationCircleIcon : CheckmarkCircle02Icon} strokeWidth={2} />
                    {validation.errors.length
                      ? "Validation needs attention"
                      : "Ready for structured review"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Import only unlocks after matching passes.
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <HugeiconsIcon icon={step.icon} strokeWidth={2} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>0{index + 1}</span>
                        {index < workflowSteps.length - 1 ? (
                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <p className="mt-1 text-xs/relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={sectionLabelClassName}>Step 1</div>
                <CardTitle className="mt-1">Prompt Builder</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={AiIdeaIcon} strokeWidth={2} />
              </div>
            </div>
            <CardDescription>
              Fill the target template metadata, copy the generated prompt to ChatGPT,
              then paste the JSON result back into this page for matching.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium">Template Name</span>
              <Input
                value={form.templateName}
                onChange={(event) => updateField("templateName", event.target.value)}
                placeholder="Strat SSS Standard 5-Way"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Pickup Configuration</span>
              <AppSelect
                value={form.pickupConfigurationId}
                onValueChange={(value) =>
                  updateField("pickupConfigurationId", value)
                }
                className="h-9 px-3 text-sm"
                options={pickupConfigurations.map((option) => ({
                  value: option.id,
                  label: `${option.code} - ${option.name}`,
                }))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Switch Type</span>
              <AppSelect
                value={form.switchTypeId}
                onValueChange={(value) => updateField("switchTypeId", value)}
                className="h-9 px-3 text-sm"
                options={switchTypes.map((option) => ({
                  value: option.id,
                  label: option.name,
                }))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Volume Count</span>
              <Input
                type="number"
                min="0"
                value={form.volumeCount}
                onChange={(event) =>
                  updateField("volumeCount", Number(event.target.value || 0))
                }
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Tone Count</span>
              <Input
                type="number"
                min="0"
                value={form.toneCount}
                onChange={(event) =>
                  updateField("toneCount", Number(event.target.value || 0))
                }
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Difficulty</span>
              <Input
                value={form.difficultyLevel}
                onChange={(event) => updateField("difficultyLevel", event.target.value)}
                placeholder="Intermediate"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Created By</span>
              <Input
                value={form.createdBy}
                onChange={(event) => updateField("createdBy", event.target.value)}
                placeholder="ChatGPT Import"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Source Type</span>
              <Input
                value={form.sourceType}
                onChange={(event) => updateField("sourceType", event.target.value)}
                placeholder="AI Import"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium">Source URL</span>
              <Input
                value={form.sourceUrl}
                onChange={(event) => updateField("sourceUrl", event.target.value)}
                placeholder="https://example.com/reference"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium">Operator Notes</span>
              <textarea
                value={form.importNotes}
                onChange={(event) => updateField("importNotes", event.target.value)}
                rows={4}
                className={textareaClassName}
                placeholder="Add notes about assumptions, guitar model, or diagram specifics."
              />
            </label>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4">
                <div className={sectionLabelClassName}>Template Slug</div>
                <div className="mt-2 text-sm font-medium">
                  {slugify(form.templateName || "ai-import") || "-"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-generated from the template name.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4">
                <div className={sectionLabelClassName}>Signal Layout</div>
                <div className="mt-2 text-sm font-medium">
                  {form.volumeCount} volume / {form.toneCount} tone
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Used inside prompt metadata and template import.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4">
                <div className={sectionLabelClassName}>AI Guardrail</div>
                <div className="mt-2 text-sm font-medium">Master-data matching only</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assets, points, switch type, and wire names cannot be invented.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={sectionLabelClassName}>Reference Catalog</div>
                <CardTitle className="mt-1">Required Data</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={DatabaseSync01Icon} strokeWidth={2} />
              </div>
            </div>
            <CardDescription>
              These are the catalogs the AI output must match before it can be
              imported safely.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Pickup Config
                </div>
                <div className="mt-1 text-sm font-medium">
                  {selectedPickupConfiguration?.name ?? "-"}
                </div>
                <div className="text-muted-foreground">
                  {selectedPickupConfiguration
                    ? `${selectedPickupConfiguration.code} | ${selectedPickupConfiguration.pickupCount} pickups`
                    : "Select one"}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Switch Logic
                </div>
                <div className="mt-1 text-sm font-medium">
                  {selectedSwitchType?.name ?? "-"}
                </div>
                <div className="text-muted-foreground">
                  {selectedSwitchType
                    ? `${selectedSwitchType.positionCount} positions | ${selectedSwitchType.lugCount} lugs`
                    : "Select one"}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Active Assets
                </div>
                <div className="mt-1 text-sm font-medium">{activeAssets.length}</div>
                <div className="text-muted-foreground">
                  {componentAssets.length} total assets in catalog
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Wire Types
                </div>
                <div className="mt-1 text-sm font-medium">{wireTypes.length}</div>
                <div className="text-muted-foreground">
                  names must match exactly
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-border/70 bg-background px-4 py-4">
              <div className={sectionLabelClassName}>
                Connection Points
              </div>
              <div className="mt-1 text-sm font-medium">{connectionPoints.length} points</div>
              <div className="text-muted-foreground">
                Every connection must use a registered point key on the matched asset.
              </div>
            </div>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Selected pickup config</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPickupConfiguration?.description ?? "No description"}
                  </div>
                </div>
                <StatusPill label={selectedPickupConfiguration?.code ?? "-"} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Selected switch logic</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedSwitchType?.switchCategory ?? "Unknown category"} with{" "}
                    {selectedSwitchType?.positionCount ?? 0} positions
                  </div>
                </div>
                <StatusPill
                  label={selectedSwitchType?.slug ?? "no-switch"}
                  tone="primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={sectionLabelClassName}>Step 2</div>
                <CardTitle className="mt-1">Generated Prompt</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
              </div>
            </div>
            <CardDescription>
              Copy this prompt to ChatGPT together with the source diagram image or
              source text.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <textarea
              value={promptText}
              readOnly
              rows={24}
              className={cn(textareaClassName, "min-h-[34rem] font-mono text-xs")}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyPrompt}>
                {copyState === "copied" ? "Prompt Copied" : "Copy Prompt"}
              </Button>
              <Button variant="outline" onClick={loadExampleOutput}>
                Load Example JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className={sectionLabelClassName}>Expected Shape</div>
              <CardTitle className="mt-1">Expected Output</CardTitle>
              <CardDescription>
                ChatGPT should return JSON in this shape so the system can match it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={expectedSchema}
                readOnly
                rows={16}
                className={cn(textareaClassName, "min-h-96 font-mono text-xs")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={sectionLabelClassName}>Step 3</div>
                  <CardTitle className="mt-1">Paste AI Output</CardTitle>
                </div>
                <StatusPill
                  label={aiOutput.trim() ? "Output Ready" : "Waiting for JSON"}
                  tone={aiOutput.trim() ? "primary" : "muted"}
                />
              </div>
              <CardDescription>
                Paste the JSON response from ChatGPT, then validate it against master
                data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <textarea
                value={aiOutput}
                onChange={(event) => setAiOutput(event.target.value)}
                rows={18}
                className={cn(textareaClassName, "min-h-[26rem] font-mono text-xs")}
                placeholder='{"template":{},"diagramJson":{},"switchLogicJson":{},"components":[],"connections":[]}'
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleValidate}>Validate Output</Button>
                <Button
                  variant="secondary"
                  onClick={handleImport}
                  disabled={
                    importing ||
                    !validation.normalizedJson ||
                    validation.errors.length > 0
                  }
                >
                  {importing ? "Importing..." : "Import to System"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiOutput("");
                    setValidation({
                      errors: [],
                      warnings: [],
                      normalizedJson: null,
                    });
                    setImportState({
                      status: "idle",
                      message: null,
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={sectionLabelClassName}>Step 4</div>
                <CardTitle className="mt-1">Validation Result</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={SearchList01Icon} strokeWidth={2} />
              </div>
            </div>
            <CardDescription>
              Errors block import. Warnings are safe to review before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Errors
                </div>
                <div className="mt-1 text-lg font-semibold">{validation.errors.length}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
                <div className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Warnings
                </div>
                <div className="mt-1 text-lg font-semibold">{validation.warnings.length}</div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border px-4 py-4 text-sm",
                importState.status === "success" &&
                  "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
                importState.status === "error" &&
                  "border-destructive/40 bg-destructive/10 text-destructive",
                importState.status === "idle" &&
                  "border-border/70 bg-background text-muted-foreground"
              )}
            >
              {importState.message ??
                "After validation passes, use Import to System to create the wiring template and its related records."}
            </div>

            <div className="grid gap-3">
              <div>
                <div className="mb-2 text-xs font-medium">Errors</div>
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                  {validation.errors.length ? (
                    <ul className="space-y-2 text-sm text-destructive">
                      {validation.errors.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No errors.</p>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium">Warnings</div>
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                  {validation.warnings.length ? (
                    <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                      {validation.warnings.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No warnings.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={sectionLabelClassName}>Import Payload</div>
                <CardTitle className="mt-1">Normalized Import Preview</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={FileImportIcon} strokeWidth={2} />
              </div>
            </div>
            <CardDescription>
              This is the matched payload after resolving pickup config, switch type,
              component assets, wire types, and point keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={validation.normalizedJson ?? ""}
              readOnly
              rows={24}
              className={cn(textareaClassName, "min-h-[34rem] font-mono text-xs")}
              placeholder="Validated import payload will appear here."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
