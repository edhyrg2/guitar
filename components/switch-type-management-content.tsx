"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  ElectricPlugsIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { AssetEditorButton } from "@/components/asset-editor-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { SwitchTypeFormDialog } from "@/components/switch-type-form-dialog";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type SwitchTypeInput, type SwitchTypeRow } from "@/lib/switch-type-types";

type SwitchTypeManagementContentProps = {
  initialSwitchTypes: SwitchTypeRow[];
};

export function SwitchTypeManagementContent({
  initialSwitchTypes,
}: SwitchTypeManagementContentProps) {
  const [switchTypes, setSwitchTypes] =
    React.useState<SwitchTypeRow[]>(initialSwitchTypes);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<SwitchTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SwitchTypeRow | null>(null);

  const stats = [
    {
      title: "Total switches",
      value: String(switchTypes.length),
      change: `${switchTypes.filter((item) => item.isActive).length} active`,
      detail: "switch references available",
      icon: ToggleOnIcon,
    },
    {
      title: "Categories",
      value: String(
        new Set(switchTypes.map((item) => item.switchCategory).filter(Boolean)).size
      ),
      change: "blade, toggle, mini toggle",
      detail: "component families tracked",
      icon: Tag01Icon,
    },
    {
      title: "SVG mapped",
      value: String(switchTypes.filter((item) => !!item.svgAssetId).length),
      change: "diagram assets referenceable",
      detail: "useful for visual builder",
      icon: ElectricPlugsIcon,
    },
  ];

  async function createSwitchType(value: SwitchTypeInput) {
    const response = await fetch("/api/switch-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create switch type");
    }

    const nextSwitchType = (await response.json()) as SwitchTypeRow;
    setSwitchTypes((current) => [nextSwitchType, ...current]);
  }

  async function updateSwitchType(id: string, value: SwitchTypeInput) {
    const response = await fetch(`/api/switch-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update switch type");
    }

    const nextSwitchType = (await response.json()) as SwitchTypeRow;
    setSwitchTypes((current) =>
      current.map((item) => (item.id === id ? nextSwitchType : item))
    );
  }

  async function removeSwitchType(id: string) {
    const response = await fetch(`/api/switch-types/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete switch type");
    }

    setSwitchTypes((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section>
        <DataTableCard
          title="Master switch type"
          description="Manage switch type references including poles, lugs, positions, and SVG asset mapping."
          rows={switchTypes}
          searchPlaceholder="Search switch, slug, category, svg asset"
          summaryLabel="switch types"
          getSearchText={(item) =>
            [
              item.name,
              item.slug,
              item.switchCategory,
              item.description,
              item.svgAssetId,
              item.positionCount.toString(),
              item.poleCount.toString(),
              item.lugCount.toString(),
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create switch type
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Poles</TableHead>
              <TableHead>Lugs</TableHead>
              <TableHead>SVG Asset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.name}
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No image</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.slug ?? "-"}</TableCell>
              <TableCell>{item.switchCategory ?? "-"}</TableCell>
              <TableCell>{item.positionCount}</TableCell>
              <TableCell>{item.poleCount}</TableCell>
              <TableCell>{item.lugCount}</TableCell>
              <TableCell className="max-w-44 truncate">{item.svgAssetId ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={item.isActive ? "Active" : "Inactive"}
                  tone={item.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <AssetEditorButton ownerType="switch-type" ownerId={item.id} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(item)}
                  >
                    <HugeiconsIcon
                      icon={PencilEdit02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          emptyMessage={
            <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
              No switch types match the current search.
            </TableCell>
          }
        />
      </section>

      <SwitchTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create switch type"
        description="Add a new switch type master data record."
        submitLabel="Create switch type"
        onSubmit={createSwitchType}
      />

      <SwitchTypeFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit switch type"
        description="Update switch hardware metadata used in diagrams and builders."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateSwitchType(editTarget.id, value);
          setEditTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete switch type"
        description={`Delete ${deleteTarget?.name ?? "this switch type"} from master data?`}
        confirmLabel="Delete switch type"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeSwitchType(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
