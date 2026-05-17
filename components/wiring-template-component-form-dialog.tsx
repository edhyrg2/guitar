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
import {
  type WiringTemplateComponentInput,
  type WiringTemplateComponentReference,
  type WiringTemplateComponentRow,
} from "@/lib/wiring-template-component-types";

type WiringTemplateComponentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: WiringTemplateComponentReference[];
  assetOptions: WiringTemplateComponentReference[];
  initialValue?: WiringTemplateComponentRow | null;
  onSubmit: (value: WiringTemplateComponentInput) => Promise<void> | void;
};

const defaultWiringTemplateComponent: WiringTemplateComponentInput = {
  wiringTemplateId: "",
  componentRole: "",
  componentType: "",
  assetId: "",
  positionX: 0,
  positionY: 0,
  rotation: 0,
  metadataJson: null,
};

export function WiringTemplateComponentFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  assetOptions,
  initialValue,
  onSubmit,
}: WiringTemplateComponentFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WiringTemplateComponentFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        wiringTemplateOptions={wiringTemplateOptions}
        assetOptions={assetOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type WiringTemplateComponentFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: WiringTemplateComponentReference[];
  assetOptions: WiringTemplateComponentReference[];
  initialValue?: WiringTemplateComponentRow | null;
  onSubmit: (value: WiringTemplateComponentInput) => Promise<void> | void;
  onCancel: () => void;
};

function WiringTemplateComponentFormDialogContent({
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  assetOptions,
  initialValue,
  onSubmit,
  onCancel,
}: WiringTemplateComponentFormDialogContentProps) {
  const [form, setForm] = React.useState<WiringTemplateComponentInput>(
    initialValue
      ? {
          wiringTemplateId: initialValue.wiringTemplateId,
          componentRole: initialValue.componentRole,
          componentType: initialValue.componentType,
          assetId: initialValue.assetId,
          positionX: initialValue.positionX,
          positionY: initialValue.positionY,
          rotation: initialValue.rotation,
          metadataJson: initialValue.metadataJson,
        }
      : {
          ...defaultWiringTemplateComponent,
          wiringTemplateId: wiringTemplateOptions[0]?.id ?? "",
          assetId: assetOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof WiringTemplateComponentInput>(
    key: K,
    value: WiringTemplateComponentInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        componentRole: form.componentRole.trim(),
        componentType: form.componentType.trim(),
        metadataJson: form.metadataJson?.trim() || null,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Wiring Template</span>
          <select
            value={form.wiringTemplateId}
            onChange={(event) => updateField("wiringTemplateId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {wiringTemplateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Component Role</span>
          <Input
            value={form.componentRole}
            onChange={(event) => updateField("componentRole", event.target.value)}
            placeholder="Switch"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Component Type</span>
          <Input
            value={form.componentType}
            onChange={(event) => updateField("componentType", event.target.value)}
            placeholder="Potentiometer"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Asset</span>
          <select
            value={form.assetId}
            onChange={(event) => updateField("assetId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {assetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Position X</span>
          <Input
            type="number"
            step="0.01"
            value={form.positionX}
            onChange={(event) =>
              updateField("positionX", Number(event.target.value || 0))
            }
            placeholder="428"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Position Y</span>
          <Input
            type="number"
            step="0.01"
            value={form.positionY}
            onChange={(event) =>
              updateField("positionY", Number(event.target.value || 0))
            }
            placeholder="126"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Rotation</span>
          <Input
            type="number"
            step="0.01"
            value={form.rotation}
            onChange={(event) =>
              updateField("rotation", Number(event.target.value || 0))
            }
            placeholder="0"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Metadata JSON</span>
          <textarea
            value={form.metadataJson ?? ""}
            onChange={(event) => updateField("metadataJson", event.target.value)}
            placeholder='{"label":"Master Volume","layer":"controls"}'
            rows={6}
            className="min-h-32 rounded-md border border-input bg-input/20 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !form.wiringTemplateId ||
            !form.componentRole.trim() ||
            !form.componentType.trim() ||
            !form.assetId
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
