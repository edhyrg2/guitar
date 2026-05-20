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
import {
  type DiagramSourceInput,
  type DiagramSourceReference,
  type DiagramSourceRow,
} from "@/lib/diagram-source-types";

type DiagramSourceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: DiagramSourceReference[];
  initialValue?: DiagramSourceRow | null;
  onSubmit: (value: DiagramSourceInput) => Promise<void> | void;
};

const defaultDiagramSource: DiagramSourceInput = {
  wiringTemplateId: "",
  sourceName: "",
  sourceBrand: null,
  sourceUrl: null,
  sourceFileUrl: null,
  sourceType: null,
  licenseNotes: null,
  isOfficial: false,
  verifiedAt: null,
  notes: null,
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function DiagramSourceFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  initialValue,
  onSubmit,
}: DiagramSourceFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DiagramSourceFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        wiringTemplateOptions={wiringTemplateOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type DiagramSourceFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  wiringTemplateOptions: DiagramSourceReference[];
  initialValue?: DiagramSourceRow | null;
  onSubmit: (value: DiagramSourceInput) => Promise<void> | void;
  onCancel: () => void;
};

function DiagramSourceFormDialogContent({
  title,
  description,
  submitLabel,
  wiringTemplateOptions,
  initialValue,
  onSubmit,
  onCancel,
}: DiagramSourceFormDialogContentProps) {
  const [form, setForm] = React.useState<
    DiagramSourceInput & { verifiedAtLocal: string }
  >(
    initialValue
      ? {
          wiringTemplateId: initialValue.wiringTemplateId,
          sourceName: initialValue.sourceName,
          sourceBrand: initialValue.sourceBrand,
          sourceUrl: initialValue.sourceUrl,
          sourceFileUrl: initialValue.sourceFileUrl,
          sourceType: initialValue.sourceType,
          licenseNotes: initialValue.licenseNotes,
          isOfficial: initialValue.isOfficial,
          verifiedAt: initialValue.verifiedAt,
          verifiedAtLocal: toDateTimeLocalValue(initialValue.verifiedAt),
          notes: initialValue.notes,
        }
      : {
          ...defaultDiagramSource,
          wiringTemplateId: wiringTemplateOptions[0]?.id ?? "",
          verifiedAtLocal: "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        wiringTemplateId: form.wiringTemplateId,
        sourceName: form.sourceName.trim(),
        sourceBrand: form.sourceBrand?.trim() || null,
        sourceUrl: form.sourceUrl?.trim() || null,
        sourceFileUrl: form.sourceFileUrl?.trim() || null,
        sourceType: form.sourceType?.trim() || null,
        licenseNotes: form.licenseNotes?.trim() || null,
        isOfficial: form.isOfficial,
        verifiedAt: form.verifiedAtLocal
          ? new Date(form.verifiedAtLocal).toISOString()
          : null,
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
          <AppSelect
            value={form.wiringTemplateId}
            onValueChange={(value) => updateField("wiringTemplateId", value)}
            className="h-9 px-3 text-sm"
            options={wiringTemplateOptions.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Source Name</span>
          <Input
            value={form.sourceName}
            onChange={(event) => updateField("sourceName", event.target.value)}
            placeholder="Factory Service Diagram"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Source Brand</span>
          <Input
            value={form.sourceBrand ?? ""}
            onChange={(event) => updateField("sourceBrand", event.target.value)}
            placeholder="Fender"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Source Type</span>
          <Input
            value={form.sourceType ?? ""}
            onChange={(event) => updateField("sourceType", event.target.value)}
            placeholder="Service Manual"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Verified At</span>
          <Input
            type="datetime-local"
            value={form.verifiedAtLocal}
            onChange={(event) => updateField("verifiedAtLocal", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Source URL</span>
          <Input
            value={form.sourceUrl ?? ""}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://example.com/source-page"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Source File URL</span>
          <Input
            value={form.sourceFileUrl ?? ""}
            onChange={(event) => updateField("sourceFileUrl", event.target.value)}
            placeholder="https://example.com/files/source.pdf"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Official Source</span>
          <AppSelect
            value={form.isOfficial ? "true" : "false"}
            onValueChange={(value) => updateField("isOfficial", value === "true")}
            className="h-9 px-3 text-sm"
            options={[
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ]}
          />
        </label>
        <div />
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">License Notes</span>
          <textarea
            value={form.licenseNotes ?? ""}
            onChange={(event) => updateField("licenseNotes", event.target.value)}
            placeholder="Usage, attribution, or redistribution note."
            rows={3}
            className="min-h-20 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Notes</span>
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Context about why this source is trusted or how it should be used."
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
          disabled={submitting || !form.wiringTemplateId || !form.sourceName.trim()}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
