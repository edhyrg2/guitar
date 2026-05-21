"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  DatabaseIcon,
  Delete02Icon,
  LinkSquare02Icon,
  Magnet02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { PickupModelFormDialog } from "@/components/pickup-model-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { AssetEditorButton } from "@/components/asset-editor-button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type PickupModelInput,
  type PickupModelReference,
  type PickupModelRow,
} from "@/lib/pickup-model-types";

type PickupModelManagementContentProps = {
  initialPickupModels: PickupModelRow[];
  brandOptions: PickupModelReference[];
  pickupTypeOptions: PickupModelReference[];
};

export function PickupModelManagementContent({
  initialPickupModels,
  brandOptions,
  pickupTypeOptions,
}: PickupModelManagementContentProps) {
  const [pickupModels, setPickupModels] =
    React.useState<PickupModelRow[]>(initialPickupModels);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<PickupModelRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PickupModelRow | null>(null);

  const stats = [
    {
      title: "Total models",
      value: String(pickupModels.length),
      change: `${pickupModels.filter((model) => model.isActivePickup).length} active`,
      detail: "pickup models available",
      icon: DatabaseIcon,
    },
    {
      title: "Brand links",
      value: String(new Set(pickupModels.map((model) => model.pickupBrandId)).size),
      change: "linked to pickup brands",
      detail: "reference integrity tracked",
      icon: LinkSquare02Icon,
    },
    {
      title: "Magnet types",
      value: String(
        new Set(pickupModels.map((model) => model.magnetType).filter(Boolean)).size
      ),
      change: "materials cataloged",
      detail: "alnico, ceramic, more",
      icon: Magnet02Icon,
    },
  ];

  async function createPickupModel(value: PickupModelInput) {
    const response = await fetch("/api/pickup-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create pickup model");
    }

    const nextPickupModel = (await response.json()) as PickupModelRow;
    setPickupModels((current) => [nextPickupModel, ...current]);
  }

  async function updatePickupModel(id: string, value: PickupModelInput) {
    const response = await fetch(`/api/pickup-models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update pickup model");
    }

    const nextPickupModel = (await response.json()) as PickupModelRow;
    setPickupModels((current) =>
      current.map((pickupModel) => (pickupModel.id === id ? nextPickupModel : pickupModel))
    );
  }

  async function removePickupModel(id: string) {
    const response = await fetch(`/api/pickup-models/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete pickup model");
    }

    setPickupModels((current) => current.filter((pickupModel) => pickupModel.id !== id));
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
          title="Pickup models master data"
          description="Manage pickup model references including brand, type, wiring details, and output metadata."
          rows={pickupModels}
          searchPlaceholder="Search model, brand, type, magnet, output"
          summaryLabel="pickup models"
          getSearchText={(pickupModel) =>
            [
              pickupModel.name,
              pickupModel.slug,
              pickupModel.pickupBrandName,
              pickupModel.pickupTypeName,
              pickupModel.positionType,
              pickupModel.wireCount,
              pickupModel.magnetType,
              pickupModel.dcResistance,
              pickupModel.outputLevel,
              pickupModel.colorCodeSchemaId,
              pickupModel.description,
              pickupModel.isActivePickup ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(pickupModel) => pickupModel.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create pickup model
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Wire</TableHead>
              <TableHead>Magnet</TableHead>
              <TableHead>Output</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(pickupModel) => (
            <TableRow key={pickupModel.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{pickupModel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {pickupModel.slug ?? "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>{pickupModel.pickupBrandName}</TableCell>
              <TableCell>{pickupModel.pickupTypeName}</TableCell>
              <TableCell>{pickupModel.positionType ?? "-"}</TableCell>
              <TableCell>{pickupModel.wireCount ?? "-"}</TableCell>
              <TableCell>{pickupModel.magnetType ?? "-"}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{pickupModel.outputLevel ?? "-"}</span>
                  <span className="text-xs text-muted-foreground">
                    {pickupModel.dcResistance ?? "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusPill
                  label={pickupModel.isActivePickup ? "Active" : "Inactive"}
                  tone={pickupModel.isActivePickup ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <AssetEditorButton ownerType="pickup-model" ownerId={pickupModel.id} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(pickupModel)}
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
                    onClick={() => setDeleteTarget(pickupModel)}
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
            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
              No pickup models match the current search.
            </TableCell>
          }
        />
      </section>

      <PickupModelFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create pickup model"
        description="Add a new pickup model and link it to an existing pickup brand and pickup type."
        submitLabel="Create pickup model"
        brandOptions={brandOptions}
        pickupTypeOptions={pickupTypeOptions}
        onSubmit={createPickupModel}
      />

      <PickupModelFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit pickup model"
        description="Update pickup model metadata used across the wiring reference."
        submitLabel="Save changes"
        brandOptions={brandOptions}
        pickupTypeOptions={pickupTypeOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updatePickupModel(editTarget.id, value);
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
        title="Delete pickup model"
        description={`Delete ${deleteTarget?.name ?? "this pickup model"} from master data?`}
        confirmLabel="Delete pickup model"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removePickupModel(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
