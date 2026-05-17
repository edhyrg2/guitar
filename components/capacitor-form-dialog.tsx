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
import { type CapacitorInput, type CapacitorRow } from "@/lib/capacitor-types";

type CapacitorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: CapacitorRow | null;
  onSubmit: (value: CapacitorInput) => Promise<void> | void;
};

const defaultCapacitor: CapacitorInput = {
  valueFarads: 0.000000022,
  valueLabel: "0.022uF",
  type: null,
  voltageRating: null,
  description: null,
  isActive: true,
};

export function CapacitorFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: CapacitorFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CapacitorFormDialogContent
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

type CapacitorFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: CapacitorRow | null;
  onSubmit: (value: CapacitorInput) => Promise<void> | void;
  onCancel: () => void;
};

function CapacitorFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: CapacitorFormDialogContentProps) {
  const [form, setForm] = React.useState<CapacitorInput>(
    initialValue
      ? {
          valueFarads: initialValue.valueFarads,
          valueLabel: initialValue.valueLabel,
          type: initialValue.type,
          voltageRating: initialValue.voltageRating,
          description: initialValue.description,
          isActive: initialValue.isActive,
        }
      : defaultCapacitor
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof CapacitorInput>(
    key: K,
    value: CapacitorInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        valueLabel: form.valueLabel.trim(),
        type: form.type?.trim() || null,
        voltageRating: form.voltageRating?.trim() || null,
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
          <span className="text-xs font-medium">Value Farads</span>
          <Input
            type="number"
            step="0.000000001"
            min="0"
            value={form.valueFarads}
            onChange={(event) =>
              updateField("valueFarads", Number(event.target.value || 0))
            }
            placeholder="0.000000022"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Value Label</span>
          <Input
            value={form.valueLabel}
            onChange={(event) => updateField("valueLabel", event.target.value)}
            placeholder="0.022uF"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Type</span>
          <Input
            value={form.type ?? ""}
            onChange={(event) => updateField("type", event.target.value)}
            placeholder="Poly Film"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Voltage Rating</span>
          <Input
            value={form.voltageRating ?? ""}
            onChange={(event) => updateField("voltageRating", event.target.value)}
            placeholder="400V"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this capacitor."
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
          disabled={submitting || !form.valueLabel.trim() || form.valueFarads <= 0}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
