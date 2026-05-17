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
  type WiringTemplateInput,
  type WiringTemplateReference,
  type WiringTemplateRow,
} from "@/lib/wiring-template-types";

type WiringTemplateFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  pickupConfigurationOptions: WiringTemplateReference[];
  switchTypeOptions: WiringTemplateReference[];
  initialValue?: WiringTemplateRow | null;
  onSubmit: (value: WiringTemplateInput) => Promise<void> | void;
};

const defaultWiringTemplate: WiringTemplateInput = {
  name: "",
  slug: null,
  description: null,
  pickupConfigurationId: "",
  switchTypeId: "",
  volumeCount: 1,
  toneCount: 1,
  difficultyLevel: null,
  diagramJson: "{\n  \n}",
  switchLogicJson: "{\n  \n}",
  isVerified: false,
  sourceType: null,
  sourceUrl: null,
  createdBy: "",
};

export function WiringTemplateFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pickupConfigurationOptions,
  switchTypeOptions,
  initialValue,
  onSubmit,
}: WiringTemplateFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WiringTemplateFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        pickupConfigurationOptions={pickupConfigurationOptions}
        switchTypeOptions={switchTypeOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type WiringTemplateFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  pickupConfigurationOptions: WiringTemplateReference[];
  switchTypeOptions: WiringTemplateReference[];
  initialValue?: WiringTemplateRow | null;
  onSubmit: (value: WiringTemplateInput) => Promise<void> | void;
  onCancel: () => void;
};

function WiringTemplateFormDialogContent({
  title,
  description,
  submitLabel,
  pickupConfigurationOptions,
  switchTypeOptions,
  initialValue,
  onSubmit,
  onCancel,
}: WiringTemplateFormDialogContentProps) {
  const [form, setForm] = React.useState<WiringTemplateInput>(
    initialValue
      ? {
          name: initialValue.name,
          slug: initialValue.slug,
          description: initialValue.description,
          pickupConfigurationId: initialValue.pickupConfigurationId,
          switchTypeId: initialValue.switchTypeId,
          volumeCount: initialValue.volumeCount,
          toneCount: initialValue.toneCount,
          difficultyLevel: initialValue.difficultyLevel,
          diagramJson: initialValue.diagramJson,
          switchLogicJson: initialValue.switchLogicJson,
          isVerified: initialValue.isVerified,
          sourceType: initialValue.sourceType,
          sourceUrl: initialValue.sourceUrl,
          createdBy: initialValue.createdBy,
        }
      : {
          ...defaultWiringTemplate,
          pickupConfigurationId: pickupConfigurationOptions[0]?.id ?? "",
          switchTypeId: switchTypeOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);

  const updateField = <K extends keyof WiringTemplateInput>(
    key: K,
    value: WiringTemplateInput[K]
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
        description: form.description?.trim() || null,
        difficultyLevel: form.difficultyLevel?.trim() || null,
        diagramJson: form.diagramJson.trim(),
        switchLogicJson: form.switchLogicJson.trim(),
        sourceType: form.sourceType?.trim() || null,
        sourceUrl: form.sourceUrl?.trim() || null,
        createdBy: form.createdBy.trim(),
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
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Strat Standard SSS 5-Way"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="strat-standard-sss-5-way"
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
          <span className="text-xs font-medium">Pickup Configuration</span>
          <select
            value={form.pickupConfigurationId}
            onChange={(event) =>
              updateField("pickupConfigurationId", event.target.value)
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {pickupConfigurationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Switch Type</span>
          <select
            value={form.switchTypeId}
            onChange={(event) => updateField("switchTypeId", event.target.value)}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {switchTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Volume Count</span>
          <Input
            type="number"
            min="0"
            value={form.volumeCount}
            onChange={(event) =>
              updateField("volumeCount", Number(event.target.value || 0))
            }
            placeholder="1"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Tone Count</span>
          <Input
            type="number"
            min="0"
            value={form.toneCount}
            onChange={(event) =>
              updateField("toneCount", Number(event.target.value || 0))
            }
            placeholder="2"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Source Type</span>
          <Input
            value={form.sourceType ?? ""}
            onChange={(event) => updateField("sourceType", event.target.value)}
            placeholder="Reference"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Created By</span>
          <Input
            value={form.createdBy}
            onChange={(event) => updateField("createdBy", event.target.value)}
            placeholder="System Seed"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Source URL</span>
          <Input
            value={form.sourceUrl ?? ""}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://example.com/diagram"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this wiring template."
            rows={3}
            className="min-h-20 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Diagram JSON</span>
          <textarea
            value={form.diagramJson}
            onChange={(event) => updateField("diagramJson", event.target.value)}
            placeholder='{"components":[],"wires":[]}'
            rows={8}
            className="min-h-44 rounded-md border border-input bg-input/20 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Switch Logic JSON</span>
          <textarea
            value={form.switchLogicJson}
            onChange={(event) =>
              updateField("switchLogicJson", event.target.value)
            }
            placeholder='{"positions":[]}'
            rows={8}
            className="min-h-44 rounded-md border border-input bg-input/20 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Verified</span>
          <select
            value={form.isVerified ? "true" : "false"}
            onChange={(event) =>
              updateField("isVerified", event.target.value === "true")
            }
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
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
            !form.pickupConfigurationId ||
            !form.switchTypeId ||
            !form.createdBy.trim() ||
            !form.diagramJson.trim() ||
            !form.switchLogicJson.trim() ||
            form.volumeCount < 0 ||
            form.toneCount < 0
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
