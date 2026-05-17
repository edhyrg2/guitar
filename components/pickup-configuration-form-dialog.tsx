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
  type PickupConfigurationInput,
  type PickupConfigurationRow,
} from "@/lib/pickup-configuration-types";

type PickupConfigurationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: PickupConfigurationRow | null;
  onSubmit: (value: PickupConfigurationInput) => Promise<void> | void;
};

const defaultConfiguration: PickupConfigurationInput = {
  code: "",
  name: "",
  pickupCount: 1,
  hasNeck: false,
  hasMiddle: false,
  hasBridge: false,
  description: null,
};

export function PickupConfigurationFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: PickupConfigurationFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PickupConfigurationFormDialogContent
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

type PickupConfigurationFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: PickupConfigurationRow | null;
  onSubmit: (value: PickupConfigurationInput) => Promise<void> | void;
  onCancel: () => void;
};

function PickupConfigurationFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: PickupConfigurationFormDialogContentProps) {
  const [form, setForm] = React.useState<PickupConfigurationInput>(
    initialValue
      ? {
          code: initialValue.code,
          name: initialValue.name,
          pickupCount: initialValue.pickupCount,
          hasNeck: initialValue.hasNeck,
          hasMiddle: initialValue.hasMiddle,
          hasBridge: initialValue.hasBridge,
          description: initialValue.description,
        }
      : defaultConfiguration
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof PickupConfigurationInput>(
    key: K,
    value: PickupConfigurationInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
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
          <span className="text-xs font-medium">Code</span>
          <Input
            value={form.code}
            onChange={(event) => updateField("code", event.target.value)}
            placeholder="SSS"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Three Single Coil"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pickup Count</span>
          <Input
            type="number"
            min="1"
            value={form.pickupCount}
            onChange={(event) =>
              updateField("pickupCount", Number(event.target.value || 0))
            }
            placeholder="3"
          />
        </label>
        <div className="grid gap-2">
          <span className="text-xs font-medium">Positions</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasNeck}
              onChange={(event) => updateField("hasNeck", event.target.checked)}
            />
            <span>Has Neck</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasMiddle}
              onChange={(event) => updateField("hasMiddle", event.target.checked)}
            />
            <span>Has Middle</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasBridge}
              onChange={(event) => updateField("hasBridge", event.target.checked)}
            />
            <span>Has Bridge</span>
          </label>
        </div>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this pickup configuration."
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
            !form.code.trim() ||
            !form.name.trim() ||
            form.pickupCount < 1
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
