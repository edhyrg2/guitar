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
import { type ModInput, type ModRow } from "@/lib/mod-types";

type ModFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ModRow | null;
  onSubmit: (value: ModInput) => Promise<void> | void;
};

const defaultMod: ModInput = {
  name: "",
  slug: null,
  description: null,
  requiresPushPull: false,
  requiresMiniToggle: false,
  requiresSpecialSwitch: false,
  difficultyLevel: null,
  isActive: true,
};

export function ModFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: ModFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModFormDialogContent
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

type ModFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ModRow | null;
  onSubmit: (value: ModInput) => Promise<void> | void;
  onCancel: () => void;
};

function ModFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: ModFormDialogContentProps) {
  const [form, setForm] = React.useState<ModInput>(
    initialValue
      ? {
          name: initialValue.name,
          slug: initialValue.slug,
          description: initialValue.description,
          requiresPushPull: initialValue.requiresPushPull,
          requiresMiniToggle: initialValue.requiresMiniToggle,
          requiresSpecialSwitch: initialValue.requiresSpecialSwitch,
          difficultyLevel: initialValue.difficultyLevel,
          isActive: initialValue.isActive,
        }
      : defaultMod
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof ModInput>(key: K, value: ModInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        description: form.description?.trim() || null,
        difficultyLevel: form.difficultyLevel?.trim() || null,
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
            placeholder="Coil Split Mod"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="coil-split-mod"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Difficulty Level</span>
          <Input
            value={form.difficultyLevel ?? ""}
            onChange={(event) => updateField("difficultyLevel", event.target.value)}
            placeholder="Intermediate"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Requires Push Pull</span>
          <select
            value={form.requiresPushPull ? "true" : "false"}
            onChange={(event) =>
              updateField("requiresPushPull", event.target.value === "true")
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Requires Mini Toggle</span>
          <select
            value={form.requiresMiniToggle ? "true" : "false"}
            onChange={(event) =>
              updateField("requiresMiniToggle", event.target.value === "true")
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Requires Special Switch</span>
          <select
            value={form.requiresSpecialSwitch ? "true" : "false"}
            onChange={(event) =>
              updateField("requiresSpecialSwitch", event.target.value === "true")
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
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
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about the accessory or wiring mod."
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
