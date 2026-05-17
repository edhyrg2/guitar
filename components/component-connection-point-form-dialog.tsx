"use client";

import * as React from "react";
import Image from "next/image";

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
  type ComponentConnectionPointInput,
  type ComponentConnectionPointReference,
  type ComponentConnectionPointRow,
} from "@/lib/component-connection-point-types";

type ComponentConnectionPointFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  componentAssetOptions: ComponentConnectionPointReference[];
  initialValue?: ComponentConnectionPointRow | null;
  onSubmit: (value: ComponentConnectionPointInput) => Promise<void> | void;
};

const defaultConnectionPoint: ComponentConnectionPointInput = {
  componentAssetId: "",
  pointKey: "",
  label: "",
  pointType: "",
  x: 0,
  y: 0,
  description: null,
};

export function ComponentConnectionPointFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  componentAssetOptions,
  initialValue,
  onSubmit,
}: ComponentConnectionPointFormDialogProps) {
  const formKey = `${initialValue?.id ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ComponentConnectionPointFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        componentAssetOptions={componentAssetOptions}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type ComponentConnectionPointFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  componentAssetOptions: ComponentConnectionPointReference[];
  initialValue?: ComponentConnectionPointRow | null;
  onSubmit: (value: ComponentConnectionPointInput) => Promise<void> | void;
  onCancel: () => void;
};

function ComponentConnectionPointFormDialogContent({
  title,
  description,
  submitLabel,
  componentAssetOptions,
  initialValue,
  onSubmit,
  onCancel,
}: ComponentConnectionPointFormDialogContentProps) {
  const [form, setForm] = React.useState<ComponentConnectionPointInput>(
    initialValue
      ? {
          componentAssetId: initialValue.componentAssetId,
          pointKey: initialValue.pointKey,
          label: initialValue.label,
          pointType: initialValue.pointType,
          x: initialValue.x,
          y: initialValue.y,
          description: initialValue.description,
        }
      : {
          ...defaultConnectionPoint,
          componentAssetId: componentAssetOptions[0]?.id ?? "",
        }
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [imageSize, setImageSize] = React.useState<{ width: number; height: number } | null>(
    null
  );
  const imageContainerRef = React.useRef<HTMLDivElement | null>(null);

  const updateField = <K extends keyof ComponentConnectionPointInput>(
    key: K,
    value: ComponentConnectionPointInput[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectedAsset = React.useMemo(
    () => componentAssetOptions.find((option) => option.id === form.componentAssetId) ?? null,
    [componentAssetOptions, form.componentAssetId]
  );
  const coordinateBase =
    selectedAsset?.width != null && selectedAsset?.height != null
      ? { width: selectedAsset.width, height: selectedAsset.height }
      : imageSize;

  function handleImageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!selectedAsset?.imageUrl || !coordinateBase || !imageContainerRef.current) {
      return;
    }

    const rect = imageContainerRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    const nextX = Number((relativeX * coordinateBase.width).toFixed(2));
    const nextY = Number((relativeY * coordinateBase.height).toFixed(2));

    setForm((current) => ({
      ...current,
      x: Math.max(0, Math.min(nextX, coordinateBase.width)),
      y: Math.max(0, Math.min(nextY, coordinateBase.height)),
    }));
  }

  const markerPosition = coordinateBase
    ? {
        left: `${Math.max(0, Math.min((form.x / coordinateBase.width) * 100, 100))}%`,
        top: `${Math.max(0, Math.min((form.y / coordinateBase.height) * 100, 100))}%`,
      }
    : null;

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        componentAssetId: form.componentAssetId,
        pointKey: form.pointKey.trim(),
        label: form.label.trim(),
        pointType: form.pointType.trim(),
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
          <span className="text-xs font-medium">Component Asset</span>
          <select
            value={form.componentAssetId}
            onChange={(event) => {
              setImageSize(null);
              updateField("componentAssetId", event.target.value);
            }}
            className="h-9 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {componentAssetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium">Coordinate Picker</span>
            <span className="text-xs text-muted-foreground">
              Klik gambar untuk mengisi X dan Y.
            </span>
          </div>
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
            {selectedAsset?.imageUrl ? (
              <>
                <div
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className="relative mx-auto w-full max-w-2xl cursor-crosshair overflow-hidden rounded-md border bg-background"
                  style={{
                    aspectRatio:
                      coordinateBase && coordinateBase.width > 0 && coordinateBase.height > 0
                        ? `${coordinateBase.width} / ${coordinateBase.height}`
                        : "4 / 3",
                  }}
                >
                  <Image
                    src={selectedAsset.imageUrl}
                    alt={selectedAsset.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    unoptimized
                    className="object-contain"
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      if (!selectedAsset.width || !selectedAsset.height) {
                        setImageSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }
                    }}
                  />
                  {markerPosition ? (
                    <div
                      className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm"
                      style={markerPosition}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-muted-foreground">
                  <span>
                    Basis ukuran:{" "}
                    {coordinateBase
                      ? `${coordinateBase.width} x ${coordinateBase.height}`
                      : "menunggu gambar dimuat"}
                  </span>
                  <span>
                    Titik terpilih: {form.x}, {form.y}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-md border bg-background text-xs text-muted-foreground">
                Asset ini belum punya gambar untuk dipilih koordinatnya.
              </div>
            )}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Point Key</span>
          <Input
            value={form.pointKey}
            onChange={(event) => updateField("pointKey", event.target.value)}
            placeholder="lug-1"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Label</span>
          <Input
            value={form.label}
            onChange={(event) => updateField("label", event.target.value)}
            placeholder="Lug 1"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Point Type</span>
          <Input
            value={form.pointType}
            onChange={(event) => updateField("pointType", event.target.value)}
            placeholder="Lug"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">X</span>
          <Input
            type="number"
            step="0.01"
            value={form.x}
            onChange={(event) => updateField("x", Number(event.target.value || 0))}
            placeholder="32"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Y</span>
          <Input
            type="number"
            step="0.01"
            value={form.y}
            onChange={(event) => updateField("y", Number(event.target.value || 0))}
            placeholder="24"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Description</span>
          <textarea
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short note about this solder or connection point."
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
            !form.componentAssetId ||
            !form.pointKey.trim() ||
            !form.label.trim() ||
            !form.pointType.trim()
          }
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
