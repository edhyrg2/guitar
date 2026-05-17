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
import { type ResistorInput, type ResistorRow } from "@/lib/resistor-types";

type ResistorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ResistorRow | null;
  onSubmit: (value: ResistorInput) => Promise<void> | void;
};

const defaultResistor: ResistorInput = {
  valueOhm: 220000,
  valueLabel: "220K",
  wattage: null,
  tolerance: null,
  description: null,
  isActive: true,
};

export function ResistorFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: ResistorFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResistorFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type ResistorFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ResistorRow | null;
  onSubmit: (value: ResistorInput) => Promise<void> | void;
  onCancel: () => void;
};

function ResistorFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: ResistorFormDialogContentProps) {
  const [form, setForm] = React.useState<ResistorInput>(
    initialValue
      ? {
          valueOhm: initialValue.valueOhm,
          valueLabel: initialValue.valueLabel,
          wattage: initialValue.wattage,
          tolerance: initialValue.tolerance,
          description: initialValue.description,
          isActive: initialValue.isActive,
        }
      : defaultResistor
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof ResistorInput>(
    key: K,
    value: ResistorInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        valueLabel: form.valueLabel.trim(),
        wattage: form.wattage?.trim() || null,
        tolerance: form.tolerance?.trim() || null,
        description: form.description?.trim() || null,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Value Ohm</span>
          <Input
            type="number"
            min="1"
            value={form.valueOhm}
            onChange={(event) =>
              updateField("valueOhm", Number(event.target.value || 0))
            }
            placeholder="220000"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Value Label</span>
          <Input
            value={form.valueLabel}
            onChange={(event) => updateField("valueLabel", event.target.value)}
            placeholder="220K"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Wattage</span>
          <Input
            value={form.wattage ?? ""}
            onChange={(event) => updateField("wattage", event.target.value)}
            placeholder="1/4W"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Tolerance</span>
          <Input
            value={form.tolerance ?? ""}
            onChange={(event) => updateField("tolerance", event.target.value)}
            placeholder="5%"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this resistor."
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Active</span>
          <select
            value={form.isActive ? "true" : "false"}
            onChange={(event) => updateField("isActive", event.target.value === "true")}
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
          disabled={submitting || !form.valueLabel.trim() || form.valueOhm <= 0}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
