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
import { type PotTypeInput, type PotTypeRow } from "@/lib/pot-type-types";

type PotTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: PotTypeRow | null;
  onSubmit: (value: PotTypeInput) => Promise<void> | void;
};

const defaultPotType: PotTypeInput = {
  name: "",
  valueOhm: 250000,
  valueLabel: "250K",
  taper: null,
  potFunction: null,
  isPushPull: false,
  isPushPush: false,
  isNoLoad: false,
  shaftType: null,
  description: null,
  isActive: true,
};

export function PotTypeFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: PotTypeFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PotTypeFormDialogContent
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

type PotTypeFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: PotTypeRow | null;
  onSubmit: (value: PotTypeInput) => Promise<void> | void;
  onCancel: () => void;
};

function PotTypeFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: PotTypeFormDialogContentProps) {
  const [form, setForm] = React.useState<PotTypeInput>(
    initialValue
      ? {
          name: initialValue.name,
          valueOhm: initialValue.valueOhm,
          valueLabel: initialValue.valueLabel,
          taper: initialValue.taper,
          potFunction: initialValue.potFunction,
          isPushPull: initialValue.isPushPull,
          isPushPush: initialValue.isPushPush,
          isNoLoad: initialValue.isNoLoad,
          shaftType: initialValue.shaftType,
          description: initialValue.description,
          isActive: initialValue.isActive,
        }
      : defaultPotType
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof PotTypeInput>(
    key: K,
    value: PotTypeInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        valueLabel: form.valueLabel.trim(),
        taper: form.taper?.trim() || null,
        potFunction: form.potFunction?.trim() || null,
        shaftType: form.shaftType?.trim() || null,
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
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="250K Audio Volume"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Value Ohm</span>
          <Input
            type="number"
            min="1"
            value={form.valueOhm}
            onChange={(event) =>
              updateField("valueOhm", Number(event.target.value || 0))
            }
            placeholder="250000"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Value Label</span>
          <Input
            value={form.valueLabel}
            onChange={(event) => updateField("valueLabel", event.target.value)}
            placeholder="250K"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Taper</span>
          <Input
            value={form.taper ?? ""}
            onChange={(event) => updateField("taper", event.target.value)}
            placeholder="Audio"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pot Function</span>
          <Input
            value={form.potFunction ?? ""}
            onChange={(event) => updateField("potFunction", event.target.value)}
            placeholder="Volume"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Shaft Type</span>
          <Input
            value={form.shaftType ?? ""}
            onChange={(event) => updateField("shaftType", event.target.value)}
            placeholder="Split Shaft"
          />
        </label>
        <div className="grid gap-2">
          <span className="text-xs font-medium">Special Features</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPushPull}
              onChange={(event) => updateField("isPushPull", event.target.checked)}
            />
            <span>Push Pull</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPushPush}
              onChange={(event) => updateField("isPushPush", event.target.checked)}
            />
            <span>Push Push</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isNoLoad}
              onChange={(event) => updateField("isNoLoad", event.target.checked)}
            />
            <span>No Load</span>
          </label>
        </div>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this potentiometer type."
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
          disabled={
            submitting ||
            !form.name.trim() ||
            !form.valueLabel.trim() ||
            form.valueOhm < 1
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
