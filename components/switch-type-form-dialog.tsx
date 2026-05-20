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
import { type SwitchTypeInput, type SwitchTypeRow } from "@/lib/switch-type-types";

type SwitchTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: SwitchTypeRow | null;
  onSubmit: (value: SwitchTypeInput) => Promise<void> | void;
};

const defaultSwitchType: SwitchTypeInput = {
  name: "",
  slug: null,
  positionCount: 2,
  poleCount: 1,
  lugCount: 2,
  switchCategory: null,
  description: null,
  svgAssetId: null,
  isActive: true,
};

export function SwitchTypeFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: SwitchTypeFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SwitchTypeFormDialogContent
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

type SwitchTypeFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: SwitchTypeRow | null;
  onSubmit: (value: SwitchTypeInput) => Promise<void> | void;
  onCancel: () => void;
};

function SwitchTypeFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: SwitchTypeFormDialogContentProps) {
  const [form, setForm] = React.useState<SwitchTypeInput>(
    initialValue
      ? {
          name: initialValue.name,
          slug: initialValue.slug,
          positionCount: initialValue.positionCount,
          poleCount: initialValue.poleCount,
          lugCount: initialValue.lugCount,
          switchCategory: initialValue.switchCategory,
          description: initialValue.description,
          svgAssetId: initialValue.svgAssetId,
          isActive: initialValue.isActive,
        }
      : defaultSwitchType
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof SwitchTypeInput>(
    key: K,
    value: SwitchTypeInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        switchCategory: form.switchCategory?.trim() || null,
        description: form.description?.trim() || null,
        svgAssetId: form.svgAssetId?.trim() || null,
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
            placeholder="5-Way Blade Switch"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="5-way-blade-switch"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Switch Category</span>
          <Input
            value={form.switchCategory ?? ""}
            onChange={(event) => updateField("switchCategory", event.target.value)}
            placeholder="Blade"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Position Count</span>
          <Input
            type="number"
            min="1"
            value={form.positionCount}
            onChange={(event) =>
              updateField("positionCount", Number(event.target.value || 0))
            }
            placeholder="5"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pole Count</span>
          <Input
            type="number"
            min="1"
            value={form.poleCount}
            onChange={(event) =>
              updateField("poleCount", Number(event.target.value || 0))
            }
            placeholder="2"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Lug Count</span>
          <Input
            type="number"
            min="1"
            value={form.lugCount}
            onChange={(event) =>
              updateField("lugCount", Number(event.target.value || 0))
            }
            placeholder="8"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">SVG Asset ID</span>
          <Input
            value={form.svgAssetId ?? ""}
            onChange={(event) => updateField("svgAssetId", event.target.value)}
            placeholder="switch-blade-5-way"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this switch type."
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
            form.positionCount < 1 ||
            form.poleCount < 1 ||
            form.lugCount < 1
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
