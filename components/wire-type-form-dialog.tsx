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
import { type WireTypeInput, type WireTypeRow } from "@/lib/wire-type-types";

type WireTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: WireTypeRow | null;
  onSubmit: (value: WireTypeInput) => Promise<void> | void;
};

const defaultWireType: WireTypeInput = {
  name: "",
  color: null,
  hexColor: null,
  wireFunction: null,
  isShielded: false,
  isGround: false,
  description: null,
};

export function WireTypeFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: WireTypeFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WireTypeFormDialogContent
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

type WireTypeFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: WireTypeRow | null;
  onSubmit: (value: WireTypeInput) => Promise<void> | void;
  onCancel: () => void;
};

function WireTypeFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: WireTypeFormDialogContentProps) {
  const [form, setForm] = React.useState<WireTypeInput>(
    initialValue
      ? {
          name: initialValue.name,
          color: initialValue.color,
          hexColor: initialValue.hexColor,
          wireFunction: initialValue.wireFunction,
          isShielded: initialValue.isShielded,
          isGround: initialValue.isGround,
          description: initialValue.description,
        }
      : defaultWireType
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof WireTypeInput>(
    key: K,
    value: WireTypeInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        color: form.color?.trim() || null,
        hexColor: form.hexColor?.trim() || null,
        wireFunction: form.wireFunction?.trim() || null,
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
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Hot Lead White"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Color</span>
          <Input
            value={form.color ?? ""}
            onChange={(event) => updateField("color", event.target.value)}
            placeholder="White"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Hex Color</span>
          <Input
            value={form.hexColor ?? ""}
            onChange={(event) => updateField("hexColor", event.target.value)}
            placeholder="#F5F5F5"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Wire Function</span>
          <Input
            value={form.wireFunction ?? ""}
            onChange={(event) => updateField("wireFunction", event.target.value)}
            placeholder="Hot"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Is Shielded</span>
          <AppSelect
            value={form.isShielded ? "true" : "false"}
            onValueChange={(value) => updateField("isShielded", value === "true")}
            className="h-9 px-3 text-sm"
            options={[
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ]}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Is Ground</span>
          <AppSelect
            value={form.isGround ? "true" : "false"}
            onValueChange={(value) => updateField("isGround", value === "true")}
            className="h-9 px-3 text-sm"
            options={[
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ]}
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this wire type."
            rows={4}
            className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
