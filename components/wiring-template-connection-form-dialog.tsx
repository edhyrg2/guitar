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
  type WiringTemplateConnectionInput,
  type WiringTemplateConnectionReference,
  type WiringTemplateConnectionRow,
} from "@/lib/wiring-template-connection-types";

type WiringTemplateConnectionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: WiringTemplateConnectionReference[];
  wireTypeOptions: WiringTemplateConnectionReference[];
  initialValue?: WiringTemplateConnectionRow | null;
  onSubmit: (value: WiringTemplateConnectionInput) => Promise<void> | void;
};

const defaultConnection: WiringTemplateConnectionInput = {
  wiringTemplateId: "",
  fromComponentRole: "",
  fromPointKey: "",
  toComponentRole: "",
  toPointKey: "",
  wireTypeId: "",
  wireColor: null,
  pathJson: null,
  label: null,
  notes: null,
};

export function WiringTemplateConnectionFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  wireTypeOptions,
  initialValue,
  onSubmit,
}: WiringTemplateConnectionFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WiringTemplateConnectionFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        wiringTemplateOptions={wiringTemplateOptions}
        wireTypeOptions={wireTypeOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type WiringTemplateConnectionFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: WiringTemplateConnectionReference[];
  wireTypeOptions: WiringTemplateConnectionReference[];
  initialValue?: WiringTemplateConnectionRow | null;
  onSubmit: (value: WiringTemplateConnectionInput) => Promise<void> | void;
  onCancel: () => void;
};

function WiringTemplateConnectionFormDialogContent({
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  wireTypeOptions,
  initialValue,
  onSubmit,
  onCancel,
}: WiringTemplateConnectionFormDialogContentProps) {
  const [form, setForm] = React.useState<WiringTemplateConnectionInput>(
    initialValue
      ? {
          wiringTemplateId: initialValue.wiringTemplateId,
          fromComponentRole: initialValue.fromComponentRole,
          fromPointKey: initialValue.fromPointKey,
          toComponentRole: initialValue.toComponentRole,
          toPointKey: initialValue.toPointKey,
          wireTypeId: initialValue.wireTypeId,
          wireColor: initialValue.wireColor,
          pathJson: initialValue.pathJson,
          label: initialValue.label,
          notes: initialValue.notes,
        }
      : {
          ...defaultConnection,
          wiringTemplateId: wiringTemplateOptions[0]?.id ?? "",
          wireTypeId: wireTypeOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof WiringTemplateConnectionInput>(
    key: K,
    value: WiringTemplateConnectionInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        fromComponentRole: form.fromComponentRole.trim(),
        fromPointKey: form.fromPointKey.trim(),
        toComponentRole: form.toComponentRole.trim(),
        toPointKey: form.toPointKey.trim(),
        wireColor: form.wireColor?.trim() || null,
        pathJson: form.pathJson?.trim() || null,
        label: form.label?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-4xl">
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
          <span className="text-xs font-medium">From Component Role</span>
          <Input
            value={form.fromComponentRole}
            onChange={(event) =>
              updateField("fromComponentRole", event.target.value)
            }
            placeholder="Switch"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">From Point Key</span>
          <Input
            value={form.fromPointKey}
            onChange={(event) => updateField("fromPointKey", event.target.value)}
            placeholder="lug-1"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">To Component Role</span>
          <Input
            value={form.toComponentRole}
            onChange={(event) => updateField("toComponentRole", event.target.value)}
            placeholder="Volume"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">To Point Key</span>
          <Input
            value={form.toPointKey}
            onChange={(event) => updateField("toPointKey", event.target.value)}
            placeholder="input"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Wire Type</span>
          <select
            value={form.wireTypeId}
            onChange={(event) => updateField("wireTypeId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {wireTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Wire Color</span>
          <Input
            value={form.wireColor ?? ""}
            onChange={(event) => updateField("wireColor", event.target.value)}
            placeholder="White"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Label</span>
          <Input
            value={form.label ?? ""}
            onChange={(event) => updateField("label", event.target.value)}
            placeholder="Switch to Volume"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Path JSON</span>
          <textarea
            value={form.pathJson ?? ""}
            onChange={(event) => updateField("pathJson", event.target.value)}
            placeholder='{"points":[{"x":428,"y":126},{"x":520,"y":180},{"x":612,"y":298}]}'
            rows={6}
            className="min-h-32 rounded-md border border-input bg-input/20 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Notes</span>
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Notes about this wire connection."
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
            !form.wiringTemplateId ||
            !form.fromComponentRole.trim() ||
            !form.fromPointKey.trim() ||
            !form.toComponentRole.trim() ||
            !form.toPointKey.trim() ||
            !form.wireTypeId
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
