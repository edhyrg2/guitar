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
import { type GuitarBrandInput, type GuitarBrandRow } from "@/lib/guitar-brand-types";

type GuitarBrandFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: GuitarBrandRow | null;
  onSubmit: (value: GuitarBrandInput) => Promise<void> | void;
};

const defaultGuitarBrand: GuitarBrandInput = {
  name: "",
  slug: null,
  logoUrl: null,
  country: null,
  website: null,
  isActive: true,
};

export function GuitarBrandFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: GuitarBrandFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <GuitarBrandFormDialogContent
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

type GuitarBrandFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: GuitarBrandRow | null;
  onSubmit: (value: GuitarBrandInput) => Promise<void> | void;
  onCancel: () => void;
};

function GuitarBrandFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: GuitarBrandFormDialogContentProps) {
  const [form, setForm] = React.useState<GuitarBrandInput>(
    initialValue
      ? {
          name: initialValue.name,
          slug: initialValue.slug,
          logoUrl: initialValue.logoUrl,
          country: initialValue.country,
          website: initialValue.website,
          isActive: initialValue.isActive,
        }
      : defaultGuitarBrand
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof GuitarBrandInput>(
    key: K,
    value: GuitarBrandInput[K]
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
        logoUrl: form.logoUrl?.trim() || null,
        country: form.country?.trim() || null,
        website: form.website?.trim() || null,
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
            placeholder="Fender"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="fender"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Logo URL</span>
          <Input
            value={form.logoUrl ?? ""}
            onChange={(event) => updateField("logoUrl", event.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Country</span>
          <Input
            value={form.country ?? ""}
            onChange={(event) => updateField("country", event.target.value)}
            placeholder="United States"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Website</span>
          <Input
            value={form.website ?? ""}
            onChange={(event) => updateField("website", event.target.value)}
            placeholder="https://www.fender.com"
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
        <Button onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
