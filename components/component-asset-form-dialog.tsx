"use client";

import * as React from "react";
import Image from "next/image";

import { AppSelect } from "@/components/ui/app-select";
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
import type { ComponentAssetCatalogGroup } from "@/lib/component-asset-catalog";
import { normalizeComponentType } from "@/lib/component-type-standards";
import {
  type ComponentAssetInput,
  type ComponentAssetRow,
  type ComponentAssetSubmitValue,
} from "@/lib/component-asset-types";

type ComponentAssetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ComponentAssetRow | null;
  catalogGroups: ComponentAssetCatalogGroup[];
  onSubmit: (value: ComponentAssetSubmitValue) => Promise<void> | void;
};

const defaultComponentAsset: ComponentAssetInput = {
  ownerType: null,
  ownerId: null,
  componentType: "",
  name: "",
  slug: null,
  svgUrl: null,
  thumbnailUrl: null,
  width: null,
  height: null,
  anchorPointsJson: null,
  editorDocumentJson: null,
  styleType: null,
  isActive: true,
};

export function ComponentAssetFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  catalogGroups,
  onSubmit,
}: ComponentAssetFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ComponentAssetFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        initialValue={initialValue}
        catalogGroups={catalogGroups}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type ComponentAssetFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: ComponentAssetRow | null;
  catalogGroups: ComponentAssetCatalogGroup[];
  onSubmit: (value: ComponentAssetSubmitValue) => Promise<void> | void;
  onCancel: () => void;
};

function ComponentAssetFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  catalogGroups,
  onSubmit,
  onCancel,
}: ComponentAssetFormDialogContentProps) {
  const [form, setForm] = React.useState<ComponentAssetInput>(
        initialValue
      ? {
          ownerType: initialValue.ownerType,
          ownerId: initialValue.ownerId,
          componentType: initialValue.componentType,
          name: initialValue.name,
          slug: initialValue.slug,
          svgUrl: initialValue.svgUrl ?? initialValue.thumbnailUrl,
          thumbnailUrl: initialValue.thumbnailUrl,
          width: initialValue.width,
          height: initialValue.height,
          anchorPointsJson: initialValue.anchorPointsJson,
          editorDocumentJson: initialValue.editorDocumentJson,
          styleType: initialValue.styleType,
          isActive: initialValue.isActive,
        }
      : defaultComponentAsset
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const componentTypeOptions = React.useMemo(() => {
    const currentType = form.componentType.trim();
    const baseOptions = catalogGroups.map((group) => group.type);

    if (!currentType || baseOptions.includes(currentType)) {
      return baseOptions;
    }

    return [currentType, ...baseOptions];
  }, [catalogGroups, form.componentType]);
  const updateField = <K extends keyof ComponentAssetInput>(
    key: K,
    value: ComponentAssetInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const imagePreviewUrl = React.useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const imagePreviewSrc = imagePreviewUrl ?? form.svgUrl ?? form.thumbnailUrl;

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        data: {
          ...form,
          componentType: normalizeComponentType(form.componentType),
          name: form.name.trim(),
          slug: form.slug?.trim() || null,
          svgUrl: form.svgUrl?.trim() || null,
          thumbnailUrl: form.svgUrl?.trim() || null,
          anchorPointsJson: form.anchorPointsJson?.trim() || null,
          styleType: form.styleType?.trim() || null,
        },
        imageFile,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Component Type</span>
          <AppSelect
            value={form.componentType}
            onValueChange={(nextType) => {
              updateField("componentType", nextType);
            }}
            className="h-9 px-3 text-sm"
            placeholder="Select component type"
            emptyLabel="Select component type"
            options={componentTypeOptions.map((option) => ({
              value: option,
              label: option,
            }))}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="e.g. Orange Drop 0.047uF Capacitor"
          />
          <span className="text-[0.7rem] text-muted-foreground">
            Free text. Component Type controls the standard pin dropdown.
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Slug</span>
          <Input
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="5-way-blade-switch-top-view"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Style Type</span>
          <Input
            value={form.styleType ?? ""}
            onChange={(event) => updateField("styleType", event.target.value)}
            placeholder="Realistic"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Image Path</span>
          <Input
            value={form.svgUrl ?? ""}
            onChange={(event) => updateField("svgUrl", event.target.value)}
            placeholder="/uploads/component-assets/your-asset.svg"
          />
          <span className="text-xs text-muted-foreground">
            Path ini dipakai sebagai asset utama. Thumbnail akan ikut memakai gambar yang
            sama, atau dibuat otomatis saat upload file.
          </span>
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Image File</span>
          <Input
            type="file"
            accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
          <span className="text-xs text-muted-foreground">
            Upload JPG, PNG, atau SVG. Sistem akan menyimpan asset utama dan membuat
            thumbnail terkompres otomatis dari file yang sama.
          </span>
        </label>
        <AssetPreviewCard
          title="Image Preview"
          src={imagePreviewSrc}
          alt={form.name || "Component asset preview"}
        />
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Width</span>
          <Input
            type="number"
            min="0"
            value={form.width ?? ""}
            onChange={(event) =>
              updateField(
                "width",
                event.target.value === "" ? null : Number(event.target.value)
              )
            }
            placeholder="320"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Height</span>
          <Input
            type="number"
            min="0"
            value={form.height ?? ""}
            onChange={(event) =>
              updateField(
                "height",
                event.target.value === "" ? null : Number(event.target.value)
              )
            }
            placeholder="120"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Anchor Points JSON</span>
          <textarea
            value={form.anchorPointsJson ?? ""}
            onChange={(event) => updateField("anchorPointsJson", event.target.value)}
            placeholder='[{"key":"lug-1","x":32,"y":24}]'
            rows={5}
            className="min-h-28 rounded-md border border-input bg-input/20 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
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
          disabled={submitting || !form.componentType.trim() || !form.name.trim()}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AssetPreviewCard({
  title,
  src,
  alt,
}: {
  title: string;
  src: string | null | undefined;
  alt: string;
}) {
  return (
    <div className="sm:col-span-2">
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
        <span className="text-xs font-medium">{title}</span>
        <div className="flex min-h-44 items-center justify-center rounded-md border bg-background">
          {src ? (
            <Image
              src={src}
              alt={alt}
              width={320}
              height={160}
              unoptimized
              className="max-h-40 max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Belum ada gambar untuk dipreview.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
