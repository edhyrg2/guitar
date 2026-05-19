"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  CustomComponentEditorTarget,
  PublishType,
} from "@/lib/custom-component-publish-target-types";

type PublishSubmitValue = {
  publishType: PublishType;
  assetSlug: string | null;
  styleType: string | null;
  payload: Record<string, unknown>;
};

type PublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedName: string;
  suggestedSlug: string;
  connectionPointCount: number;
  initialTarget?: CustomComponentEditorTarget | null;
  onSubmit: (value: PublishSubmitValue) => Promise<void> | void;
};

const PUBLISH_TYPE_OPTIONS: Array<{ value: PublishType; label: string }> = [
  { value: "switch-type", label: "Switch Type" },
  { value: "pot-type", label: "Potentiometer" },
  { value: "capacitor", label: "Capacitor" },
  { value: "resistor", label: "Resistor" },
  { value: "pickup-type", label: "Pickup Type" },
  { value: "mod", label: "Accessory / Mod" },
];

function createInitialState(
  publishType: PublishType,
  suggestedName: string,
  suggestedSlug: string,
  connectionPointCount: number,
  initialPayload?: Record<string, unknown> | null,
  initialStyleType?: string | null
) {
  const normalizedName = suggestedName.trim() || "Custom Component";

  const baseState = {
    publishType,
    assetSlug: suggestedSlug || "",
    styleType: initialStyleType ?? "Custom",
    switchType: {
      name: normalizedName,
      slug: suggestedSlug || "",
      positionCount: 2,
      poleCount: 1,
      lugCount: Math.max(connectionPointCount, 1),
      switchCategory: "",
      description: "",
      isActive: true,
    },
    potType: {
      name: normalizedName,
      valueOhm: 250000,
      valueLabel: "250K",
      taper: "",
      potFunction: "",
      isPushPull: false,
      isPushPush: false,
      isNoLoad: false,
      shaftType: "",
      description: "",
      isActive: true,
    },
    capacitor: {
      valueFarads: 0.000000022,
      valueLabel: "0.022uF",
      type: "",
      voltageRating: "",
      description: "",
      isActive: true,
    },
    resistor: {
      valueOhm: 220000,
      valueLabel: "220K",
      wattage: "",
      tolerance: "",
      description: "",
      isActive: true,
    },
    pickupType: {
      name: normalizedName,
      slug: suggestedSlug || "",
      coilCount: "",
      description: "",
      isActive: true,
    },
    mod: {
      name: normalizedName,
      slug: suggestedSlug || "",
      description: "",
      difficultyLevel: "",
      requiresPushPull: false,
      requiresMiniToggle: false,
      requiresSpecialSwitch: false,
      isActive: true,
    },
  };

  if (!initialPayload) {
    return baseState;
  }

  if (publishType === "switch-type") {
    return {
      ...baseState,
      switchType: {
        ...baseState.switchType,
        ...initialPayload,
      },
    };
  }

  if (publishType === "pot-type") {
    return {
      ...baseState,
      potType: {
        ...baseState.potType,
        ...initialPayload,
      },
    };
  }

  if (publishType === "capacitor") {
    return {
      ...baseState,
      capacitor: {
        ...baseState.capacitor,
        ...initialPayload,
      },
    };
  }

  if (publishType === "resistor") {
    return {
      ...baseState,
      resistor: {
        ...baseState.resistor,
        ...initialPayload,
      },
    };
  }

  if (publishType === "pickup-type") {
    return {
      ...baseState,
      pickupType: {
        ...baseState.pickupType,
        ...initialPayload,
      },
    };
  }

  return {
    ...baseState,
    mod: {
      ...baseState.mod,
      ...initialPayload,
    },
  };
}

export function PublishDialog({
  open,
  onOpenChange,
  suggestedName,
  suggestedSlug,
  connectionPointCount,
  initialTarget,
  onSubmit,
}: PublishDialogProps) {
  const initialPublishType = initialTarget?.ownerType ?? "switch-type";
  const [state, setState] = React.useState(() =>
    createInitialState(
      initialPublishType,
      initialTarget?.assetName ?? suggestedName,
      initialTarget?.assetSlug ?? suggestedSlug,
      connectionPointCount,
      initialTarget?.payload ?? null,
      initialTarget?.styleType ?? null
    )
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSubmitError(null);
    }
  }, [open]);

  function updateState<Key extends keyof typeof state>(
    key: Key,
    value: (typeof state)[Key]
  ) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function updateNestedState<
    Key extends "switchType" | "potType" | "capacitor" | "resistor" | "pickupType" | "mod",
    Field extends keyof (typeof state)[Key],
  >(key: Key, field: Field, value: (typeof state)[Key][Field]) {
    setState((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload =
        state.publishType === "switch-type"
          ? state.switchType
          : state.publishType === "pot-type"
            ? state.potType
            : state.publishType === "capacitor"
              ? state.capacitor
              : state.publishType === "resistor"
                ? state.resistor
                : state.publishType === "pickup-type"
                  ? state.pickupType
                  : state.mod;

      await onSubmit({
        publishType: state.publishType,
        assetSlug: state.assetSlug.trim() || null,
        styleType: state.styleType.trim() || null,
        payload,
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to publish custom component.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    (state.publishType === "switch-type" && state.switchType.name.trim()) ||
    (state.publishType === "pot-type" &&
      state.potType.name.trim() &&
      state.potType.valueLabel.trim() &&
      state.potType.valueOhm > 0) ||
    (state.publishType === "capacitor" &&
      state.capacitor.valueLabel.trim() &&
      state.capacitor.valueFarads > 0) ||
    (state.publishType === "resistor" &&
      state.resistor.valueLabel.trim() &&
      state.resistor.valueOhm > 0) ||
    (state.publishType === "pickup-type" && state.pickupType.name.trim()) ||
    (state.publishType === "mod" && state.mod.name.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Publish Custom Component</DialogTitle>
          <DialogDescription>
            Pilih target komponen, lalu isi field master datanya. Visual canvas dan
            connection point akan dipublikasikan sebagai asset milik komponen ini.
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <div className="mx-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <div className="grid gap-4 px-6 pb-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium">Component Type</span>
            <select
              value={state.publishType}
              onChange={(event) =>
                updateState("publishType", event.target.value as PublishType)
              }
              disabled={Boolean(initialTarget)}
              className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
            >
              {PUBLISH_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium">Asset Slug</span>
            <Input
              value={state.assetSlug}
              onChange={(event) => updateState("assetSlug", event.target.value)}
              placeholder="custom-component-slug"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-xs font-medium">Style Type</span>
            <Input
              value={state.styleType}
              onChange={(event) => updateState("styleType", event.target.value)}
              placeholder="Custom"
            />
          </label>

          {state.publishType === "switch-type" ? (
            <>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-xs font-medium">Name</span>
                <Input
                  value={state.switchType.name}
                  onChange={(event) =>
                    updateNestedState("switchType", "name", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Slug</span>
                <Input
                  value={state.switchType.slug}
                  onChange={(event) =>
                    updateNestedState("switchType", "slug", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Category</span>
                <Input
                  value={state.switchType.switchCategory}
                  onChange={(event) =>
                    updateNestedState("switchType", "switchCategory", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Position Count</span>
                <Input
                  type="number"
                  min="1"
                  value={state.switchType.positionCount}
                  onChange={(event) =>
                    updateNestedState(
                      "switchType",
                      "positionCount",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Pole Count</span>
                <Input
                  type="number"
                  min="1"
                  value={state.switchType.poleCount}
                  onChange={(event) =>
                    updateNestedState(
                      "switchType",
                      "poleCount",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Lug Count</span>
                <Input
                  type="number"
                  min="1"
                  value={state.switchType.lugCount}
                  onChange={(event) =>
                    updateNestedState(
                      "switchType",
                      "lugCount",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
            </>
          ) : null}

          {state.publishType === "pot-type" ? (
            <>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-xs font-medium">Name</span>
                <Input
                  value={state.potType.name}
                  onChange={(event) =>
                    updateNestedState("potType", "name", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Ohm</span>
                <Input
                  type="number"
                  min="1"
                  value={state.potType.valueOhm}
                  onChange={(event) =>
                    updateNestedState(
                      "potType",
                      "valueOhm",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Label</span>
                <Input
                  value={state.potType.valueLabel}
                  onChange={(event) =>
                    updateNestedState("potType", "valueLabel", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Taper</span>
                <Input
                  value={state.potType.taper}
                  onChange={(event) =>
                    updateNestedState("potType", "taper", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Function</span>
                <Input
                  value={state.potType.potFunction}
                  onChange={(event) =>
                    updateNestedState("potType", "potFunction", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}

          {state.publishType === "capacitor" ? (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Farads</span>
                <Input
                  type="number"
                  min="0"
                  step="0.000000001"
                  value={state.capacitor.valueFarads}
                  onChange={(event) =>
                    updateNestedState(
                      "capacitor",
                      "valueFarads",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Label</span>
                <Input
                  value={state.capacitor.valueLabel}
                  onChange={(event) =>
                    updateNestedState("capacitor", "valueLabel", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Type</span>
                <Input
                  value={state.capacitor.type}
                  onChange={(event) =>
                    updateNestedState("capacitor", "type", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Voltage Rating</span>
                <Input
                  value={state.capacitor.voltageRating}
                  onChange={(event) =>
                    updateNestedState("capacitor", "voltageRating", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}

          {state.publishType === "resistor" ? (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Ohm</span>
                <Input
                  type="number"
                  min="1"
                  value={state.resistor.valueOhm}
                  onChange={(event) =>
                    updateNestedState(
                      "resistor",
                      "valueOhm",
                      Number(event.target.value || 0)
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Value Label</span>
                <Input
                  value={state.resistor.valueLabel}
                  onChange={(event) =>
                    updateNestedState("resistor", "valueLabel", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Wattage</span>
                <Input
                  value={state.resistor.wattage}
                  onChange={(event) =>
                    updateNestedState("resistor", "wattage", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Tolerance</span>
                <Input
                  value={state.resistor.tolerance}
                  onChange={(event) =>
                    updateNestedState("resistor", "tolerance", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}

          {state.publishType === "pickup-type" ? (
            <>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-xs font-medium">Name</span>
                <Input
                  value={state.pickupType.name}
                  onChange={(event) =>
                    updateNestedState("pickupType", "name", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Slug</span>
                <Input
                  value={state.pickupType.slug}
                  onChange={(event) =>
                    updateNestedState("pickupType", "slug", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Coil Count</span>
                <Input
                  value={state.pickupType.coilCount}
                  onChange={(event) =>
                    updateNestedState("pickupType", "coilCount", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}

          {state.publishType === "mod" ? (
            <>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-xs font-medium">Name</span>
                <Input
                  value={state.mod.name}
                  onChange={(event) =>
                    updateNestedState("mod", "name", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Slug</span>
                <Input
                  value={state.mod.slug}
                  onChange={(event) =>
                    updateNestedState("mod", "slug", event.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium">Difficulty</span>
                <Input
                  value={state.mod.difficultyLevel}
                  onChange={(event) =>
                    updateNestedState("mod", "difficultyLevel", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !canSubmit}>
            {submitting ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { PublishSubmitValue };
