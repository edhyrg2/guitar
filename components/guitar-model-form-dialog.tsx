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
  type GuitarModelInput,
  type GuitarModelReference,
  type GuitarModelRow,
} from "@/lib/guitar-model-types";

type GuitarModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  guitarBrandOptions: GuitarModelReference[];
  initialValue?: GuitarModelRow | null;
  onSubmit: (value: GuitarModelInput) => Promise<void> | void;
};

const defaultGuitarModel: GuitarModelInput = {
  guitarBrandId: "",
  name: "",
  slug: null,
  series: null,
  yearStart: null,
  yearEnd: null,
  bodyType: null,
  defaultPickupConfig: null,
  description: null,
  isActive: true,
};

export function GuitarModelFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  guitarBrandOptions,
  initialValue,
  onSubmit,
}: GuitarModelFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <GuitarModelFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        guitarBrandOptions={guitarBrandOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type GuitarModelFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  guitarBrandOptions: GuitarModelReference[];
  initialValue?: GuitarModelRow | null;
  onSubmit: (value: GuitarModelInput) => Promise<void> | void;
  onCancel: () => void;
};

function GuitarModelFormDialogContent({
  title,
  description,
  submitLabel,
  guitarBrandOptions,
  initialValue,
  onSubmit,
  onCancel,
}: GuitarModelFormDialogContentProps) {
  const [form, setForm] = React.useState<GuitarModelInput>(
    initialValue
      ? {
          guitarBrandId: initialValue.guitarBrandId,
          name: initialValue.name,
          slug: initialValue.slug,
          series: initialValue.series,
          yearStart: initialValue.yearStart,
          yearEnd: initialValue.yearEnd,
          bodyType: initialValue.bodyType,
          defaultPickupConfig: initialValue.defaultPickupConfig,
          description: initialValue.description,
          isActive: initialValue.isActive,
        }
      : {
          ...defaultGuitarModel,
          guitarBrandId: guitarBrandOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof GuitarModelInput>(
    key: K,
    value: GuitarModelInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        guitarBrandId: form.guitarBrandId,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        series: form.series?.trim() || null,
        yearStart: form.yearStart,
        yearEnd: form.yearEnd,
        bodyType: form.bodyType?.trim() || null,
        defaultPickupConfig: form.defaultPickupConfig?.trim() || null,
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
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Guitar Brand</span>
          <AppSelect
            value={form.guitarBrandId}
            onValueChange={(value) => updateField("guitarBrandId", value)}
            className="h-9 px-3 text-sm"
            options={guitarBrandOptions.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Stratocaster"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="stratocaster"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Series</span>
          <Input
            value={form.series ?? ""}
            onChange={(event) => updateField("series", event.target.value)}
            placeholder="American Professional II"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Year Start</span>
          <Input
            type="number"
            value={form.yearStart ?? ""}
            onChange={(event) =>
              updateField(
                "yearStart",
                event.target.value ? Number(event.target.value) : null
              )
            }
            placeholder="2020"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Year End</span>
          <Input
            type="number"
            value={form.yearEnd ?? ""}
            onChange={(event) =>
              updateField(
                "yearEnd",
                event.target.value ? Number(event.target.value) : null
              )
            }
            placeholder="2024"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Body Type</span>
          <Input
            value={form.bodyType ?? ""}
            onChange={(event) => updateField("bodyType", event.target.value)}
            placeholder="Solid Body"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Default Pickup Config</span>
          <Input
            value={form.defaultPickupConfig ?? ""}
            onChange={(event) =>
              updateField("defaultPickupConfig", event.target.value)
            }
            placeholder="SSS"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about the guitar model."
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Active</span>
          <AppSelect
            value={form.isActive ? "true" : "false"}
            onValueChange={(value) => updateField("isActive", value === "true")}
            className="h-9 px-3 text-sm"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !form.name.trim() || !form.guitarBrandId}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
