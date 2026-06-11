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
  const imageElementRef = React.useRef<HTMLImageElement | null>(null);

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
  const standardPinOptions = selectedAsset?.standardPins ?? [];
  const selectedStandardPinValue = standardPinOptions.some((pin) => pin.pointKey === form.pointKey)
    ? form.pointKey
    : "";

  function applyStandardPin(pointKey: string) {
    const pin = standardPinOptions.find((item) => item.pointKey === pointKey);
    if (!pin) return;

    setForm((current) => ({
      ...current,
      pointKey: pin.pointKey,
      label: pin.label,
      pointType: pin.pointType,
      description: pin.description ?? current.description,
    }));
  }
  const coordinateBase =
    selectedAsset?.width != null && selectedAsset?.height != null
      ? { width: selectedAsset.width, height: selectedAsset.height }
      : imageSize;
  const [imageDisplayBox, setImageDisplayBox] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const syncImageDisplayBox = React.useCallback(() => {
    const container = imageContainerRef.current;
    const image = imageElementRef.current;

    if (!container || !image) {
      setImageDisplayBox(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    setImageDisplayBox({
      x: imageRect.left - containerRect.left,
      y: imageRect.top - containerRect.top,
      width: imageRect.width,
      height: imageRect.height,
    });
  }, []);

  React.useEffect(() => {
    const container = imageContainerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncImageDisplayBox();
    });

    observer.observe(container);
    syncImageDisplayBox();

    return () => observer.disconnect();
  }, [selectedAsset?.id, syncImageDisplayBox]);

  function handleImageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!selectedAsset?.imageUrl || !coordinateBase || !imageDisplayBox) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const relativeX = localX / rect.width;
    const relativeY = localY / rect.height;

    const nextX = Number((relativeX * coordinateBase.width).toFixed(2));
    const nextY = Number((relativeY * coordinateBase.height).toFixed(2));

    setForm((current) => ({
      ...current,
      x: Math.max(0, Math.min(nextX, coordinateBase.width)),
      y: Math.max(0, Math.min(nextY, coordinateBase.height)),
    }));
  }

  const markerPosition = coordinateBase && imageDisplayBox
    ? {
        left: imageDisplayBox.x + (Math.max(0, Math.min(form.x, coordinateBase.width)) / coordinateBase.width) * imageDisplayBox.width,
        top: imageDisplayBox.y + (Math.max(0, Math.min(form.y, coordinateBase.height)) / coordinateBase.height) * imageDisplayBox.height,
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
          <AppSelect
            value={form.componentAssetId}
            onValueChange={(value) => {
              setImageSize(null);
              setImageDisplayBox(null);
              updateField("componentAssetId", value);
            }}
            className="h-9 px-3 text-sm"
            options={componentAssetOptions.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
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
                    ref={imageElementRef}
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      if (!selectedAsset.width || !selectedAsset.height) {
                        setImageSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }
                      syncImageDisplayBox();
                    }}
                  />
                  {imageDisplayBox ? (
                    <div
                      className="absolute cursor-crosshair"
                      style={{
                        left: imageDisplayBox.x,
                        top: imageDisplayBox.y,
                        width: imageDisplayBox.width,
                        height: imageDisplayBox.height,
                      }}
                      onClick={handleImageClick}
                    />
                  ) : null}
                  {markerPosition ? (
                    <div
                      className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm"
                      style={{
                        left: markerPosition.left,
                        top: markerPosition.top,
                      }}
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
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-medium">Standard Pin</span>
          <AppSelect
            value={selectedStandardPinValue}
            onValueChange={applyStandardPin}
            placeholder={standardPinOptions.length ? "Choose standard pin for this component type" : "No standard pins available"}
            disabled={!standardPinOptions.length}
            className="h-9 px-3 text-sm"
            options={standardPinOptions.map((pin) => ({
              value: pin.pointKey,
              label: `${pin.pointKey} — ${pin.label} (${pin.pointType})`,
            }))}
          />
          <span className="text-[0.7rem] text-muted-foreground">
            {selectedAsset?.componentType
              ? `Using ${selectedAsset.componentType} standard pins. Selecting one fills Point Key, Label, and Point Type.`
              : "Select a component asset first to see standard pins."}
          </span>
        </label>
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
