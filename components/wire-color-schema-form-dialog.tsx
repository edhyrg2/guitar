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
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import {
  type WireColorSchemaInput,
  type WireColorSchemaReference,
  type WireColorSchemaRow,
} from "@/lib/wire-color-schema-types";

type WireColorSchemaFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  brandOptions: WireColorSchemaReference[];
  pickupTypeOptions: WireColorSchemaReference[];
  initialValue?: WireColorSchemaRow | null;
  onSubmit: (value: WireColorSchemaInput) => Promise<void> | void;
};

const defaultSchema: WireColorSchemaInput = {
  pickupBrandId: "",
  name: "",
  pickupTypeId: "",
  hotColor: null,
  groundColor: null,
  shieldColor: null,
  northStartColor: null,
  northFinishColor: null,
  southStartColor: null,
  southFinishColor: null,
  batteryPositiveColor: null,
  batteryNegativeColor: null,
  notes: null,
};

export function WireColorSchemaFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  brandOptions,
  pickupTypeOptions,
  initialValue,
  onSubmit,
}: WireColorSchemaFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WireColorSchemaFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        brandOptions={brandOptions}
        pickupTypeOptions={pickupTypeOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type WireColorSchemaFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  brandOptions: WireColorSchemaReference[];
  pickupTypeOptions: WireColorSchemaReference[];
  initialValue?: WireColorSchemaRow | null;
  onSubmit: (value: WireColorSchemaInput) => Promise<void> | void;
  onCancel: () => void;
};

function WireColorSchemaFormDialogContent({
  title,
  description,
  submitLabel,
  brandOptions,
  pickupTypeOptions,
  initialValue,
  onSubmit,
  onCancel,
}: WireColorSchemaFormDialogContentProps) {
  const [form, setForm] = React.useState<WireColorSchemaInput>(
    initialValue
      ? {
          pickupBrandId: initialValue.pickupBrandId,
          name: initialValue.name,
          pickupTypeId: initialValue.pickupTypeId,
          hotColor: initialValue.hotColor,
          groundColor: initialValue.groundColor,
          shieldColor: initialValue.shieldColor,
          northStartColor: initialValue.northStartColor,
          northFinishColor: initialValue.northFinishColor,
          southStartColor: initialValue.southStartColor,
          southFinishColor: initialValue.southFinishColor,
          batteryPositiveColor: initialValue.batteryPositiveColor,
          batteryNegativeColor: initialValue.batteryNegativeColor,
          notes: initialValue.notes,
        }
      : {
          ...defaultSchema,
          pickupBrandId: brandOptions[0]?.id ?? "",
          pickupTypeId: pickupTypeOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof WireColorSchemaInput>(
    key: K,
    value: WireColorSchemaInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        pickupBrandId: form.pickupBrandId,
        name: form.name.trim(),
        pickupTypeId: form.pickupTypeId,
        hotColor: form.hotColor?.trim() || null,
        groundColor: form.groundColor?.trim() || null,
        shieldColor: form.shieldColor?.trim() || null,
        northStartColor: form.northStartColor?.trim() || null,
        northFinishColor: form.northFinishColor?.trim() || null,
        southStartColor: form.southStartColor?.trim() || null,
        southFinishColor: form.southFinishColor?.trim() || null,
        batteryPositiveColor: form.batteryPositiveColor?.trim() || null,
        batteryNegativeColor: form.batteryNegativeColor?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  const colorFields: Array<{
    key: keyof WireColorSchemaInput;
    label: string;
    placeholder: string;
  }> = [
    { key: "hotColor", label: "Hot Color", placeholder: "White" },
    { key: "groundColor", label: "Ground Color", placeholder: "Black" },
    { key: "shieldColor", label: "Shield Color", placeholder: "Bare" },
    { key: "northStartColor", label: "North Start", placeholder: "Green" },
    { key: "northFinishColor", label: "North Finish", placeholder: "White" },
    { key: "southStartColor", label: "South Start", placeholder: "Black" },
    { key: "southFinishColor", label: "South Finish", placeholder: "Red" },
    {
      key: "batteryPositiveColor",
      label: "Battery Positive",
      placeholder: "Red",
    },
    {
      key: "batteryNegativeColor",
      label: "Battery Negative",
      placeholder: "Black",
    },
  ];

  return (
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pickup Brand</span>
          <AppSelect
            value={form.pickupBrandId}
            onValueChange={(value) => updateField("pickupBrandId", value)}
            className="h-9 px-3 text-sm"
            options={brandOptions.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pickup Type</span>
          <AppSelect
            value={form.pickupTypeId}
            onValueChange={(value) => updateField("pickupTypeId", value)}
            className="h-9 px-3 text-sm"
            options={pickupTypeOptions.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Schema Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Fender Vintage Single Coil"
          />
        </label>
        {colorFields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="text-xs font-medium">{field.label}</span>
            <Input
              value={(form[field.key] as string | null) ?? ""}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
            />
          </label>
        ))}
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Notes</span>
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Extra notes about wire colors, conductor layout, or brand-specific caveats."
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
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
            !form.name.trim() ||
            !form.pickupBrandId ||
            !form.pickupTypeId
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
