"use client";

import * as React from "react";

import { type BrandInput, type BrandRow } from "@/lib/brand-types";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BrandFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: BrandRow | null;
  onSubmit: (value: BrandInput) => Promise<void> | void;
};

const defaultBrand: BrandInput = {
  name: "",
  slug: null,
  logo: null,
  website: null,
  type: null,
  country: null,
  active: true,
};

export function BrandFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: BrandFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BrandFormDialogContent
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

type BrandFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: BrandRow | null;
  onSubmit: (value: BrandInput) => Promise<void> | void;
  onCancel: () => void;
};

function BrandFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: BrandFormDialogContentProps) {
  const [form, setForm] = React.useState<BrandInput>(
    initialValue
      ? {
          name: initialValue.name,
          slug: initialValue.slug,
          logo: initialValue.logo,
          website: initialValue.website,
          type: initialValue.type,
          country: initialValue.country,
          active: initialValue.active,
        }
      : defaultBrand
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof BrandInput>(key: K, value: BrandInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        logo: form.logo?.trim() || null,
        website: form.website?.trim() || null,
        type: form.type?.trim() || null,
        country: form.country?.trim() || null,
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
          <span className="text-xs font-medium">Logo</span>
          <Input
            value={form.logo ?? ""}
            onChange={(event) => updateField("logo", event.target.value)}
            placeholder="F"
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
          <span className="text-xs font-medium">Type</span>
          <Input
            value={form.type ?? ""}
            onChange={(event) => updateField("type", event.target.value)}
            placeholder="Electric Guitar"
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
          <span className="text-xs font-medium">Active</span>
          <AppSelect
            value={form.active ? "true" : "false"}
            onValueChange={(value) => updateField("active", value === "true")}
            className="h-7 px-2 text-xs"
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
        <Button onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
