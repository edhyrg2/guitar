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
  type PickupModelInput,
  type PickupModelReference,
  type PickupModelRow,
} from "@/lib/pickup-model-types";

type PickupModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  brandOptions: PickupModelReference[];
  pickupTypeOptions: PickupModelReference[];
  initialValue?: PickupModelRow | null;
  onSubmit: (value: PickupModelInput) => Promise<void> | void;
};

const defaultPickupModel: PickupModelInput = {
  pickupBrandId: "",
  pickupTypeId: "",
  name: "",
  slug: null,
  positionType: null,
  wireCount: null,
  magnetType: null,
  dcResistance: null,
  outputLevel: null,
  isActivePickup: true,
  colorCodeSchemaId: null,
  description: null,
};

export function PickupModelFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  brandOptions,
  pickupTypeOptions,
  initialValue,
  onSubmit,
}: PickupModelFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PickupModelFormDialogContent
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

type PickupModelFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  brandOptions: PickupModelReference[];
  pickupTypeOptions: PickupModelReference[];
  initialValue?: PickupModelRow | null;
  onSubmit: (value: PickupModelInput) => Promise<void> | void;
  onCancel: () => void;
};

function PickupModelFormDialogContent({
  title,
  description,
  submitLabel,
  brandOptions,
  pickupTypeOptions,
  initialValue,
  onSubmit,
  onCancel,
}: PickupModelFormDialogContentProps) {
  const [form, setForm] = React.useState<PickupModelInput>(
    initialValue
      ? {
          pickupBrandId: initialValue.pickupBrandId,
          pickupTypeId: initialValue.pickupTypeId,
          name: initialValue.name,
          slug: initialValue.slug,
          positionType: initialValue.positionType,
          wireCount: initialValue.wireCount,
          magnetType: initialValue.magnetType,
          dcResistance: initialValue.dcResistance,
          outputLevel: initialValue.outputLevel,
          isActivePickup: initialValue.isActivePickup,
          colorCodeSchemaId: initialValue.colorCodeSchemaId,
          description: initialValue.description,
        }
      : {
          ...defaultPickupModel,
          pickupBrandId: brandOptions[0]?.id ?? "",
          pickupTypeId: pickupTypeOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof PickupModelInput>(
    key: K,
    value: PickupModelInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        pickupBrandId: form.pickupBrandId,
        pickupTypeId: form.pickupTypeId,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        positionType: form.positionType?.trim() || null,
        wireCount: form.wireCount?.trim() || null,
        magnetType: form.magnetType?.trim() || null,
        dcResistance: form.dcResistance?.trim() || null,
        outputLevel: form.outputLevel?.trim() || null,
        colorCodeSchemaId: form.colorCodeSchemaId?.trim() || null,
        description: form.description?.trim() || null,
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
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pickup Brand</span>
          <select
            value={form.pickupBrandId}
            onChange={(event) => updateField("pickupBrandId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {brandOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pickup Type</span>
          <select
            value={form.pickupTypeId}
            onChange={(event) => updateField("pickupTypeId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {pickupTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Custom Shop '69 Strat Set"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="custom-shop-69-strat-set"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Position Type</span>
          <Input
            value={form.positionType ?? ""}
            onChange={(event) => updateField("positionType", event.target.value)}
            placeholder="Neck / Middle / Bridge"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Wire Count</span>
          <Input
            value={form.wireCount ?? ""}
            onChange={(event) => updateField("wireCount", event.target.value)}
            placeholder="2 Conductor"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Magnet Type</span>
          <Input
            value={form.magnetType ?? ""}
            onChange={(event) => updateField("magnetType", event.target.value)}
            placeholder="Alnico 5"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">DC Resistance</span>
          <Input
            value={form.dcResistance ?? ""}
            onChange={(event) => updateField("dcResistance", event.target.value)}
            placeholder="5.8k"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Output Level</span>
          <Input
            value={form.outputLevel ?? ""}
            onChange={(event) => updateField("outputLevel", event.target.value)}
            placeholder="Vintage"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Color Code Schema ID</span>
          <Input
            value={form.colorCodeSchemaId ?? ""}
            onChange={(event) =>
              updateField("colorCodeSchemaId", event.target.value)
            }
            placeholder="sd-4-wire"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about the pickup model."
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Active</span>
          <select
            value={form.isActivePickup ? "true" : "false"}
            onChange={(event) =>
              updateField("isActivePickup", event.target.value === "true")
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
