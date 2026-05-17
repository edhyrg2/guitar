"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  NoteIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { PickupTypeFormDialog } from "@/components/pickup-type-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type PickupTypeInput, type PickupTypeRow } from "@/lib/pickup-type-types";

type PickupTypeManagementContentProps = {
  initialPickupTypes: PickupTypeRow[];
};

export function PickupTypeManagementContent({
  initialPickupTypes,
}: PickupTypeManagementContentProps) {
  const [pickupTypes, setPickupTypes] =
    React.useState<PickupTypeRow[]>(initialPickupTypes);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<PickupTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PickupTypeRow | null>(null);

  const stats = [
    {
      title: "Total types",
      value: String(pickupTypes.length),
      change: `${pickupTypes.filter((type) => type.isActive).length} active`,
      detail: "pickup type records available",
      icon: Tag01Icon,
    },
    {
      title: "Coil variants",
      value: String(
        new Set(pickupTypes.map((type) => type.coilCount).filter(Boolean)).size
      ),
      change: "dropdown-ready options in use",
      detail: "single coil to piezo",
      icon: ToggleOnIcon,
    },
    {
      title: "With description",
      value: String(pickupTypes.filter((type) => !!type.description).length),
      change: "reference notes available",
      detail: "helpful for builder context",
      icon: NoteIcon,
    },
  ];

  async function createPickupType(value: PickupTypeInput) {
    const response = await fetch("/api/pickup-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create pickup type");
    }

    const nextPickupType = (await response.json()) as PickupTypeRow;
    setPickupTypes((current) => [nextPickupType, ...current]);
  }

  async function updatePickupType(id: string, value: PickupTypeInput) {
    const response = await fetch(`/api/pickup-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update pickup type");
    }

    const nextPickupType = (await response.json()) as PickupTypeRow;
    setPickupTypes((current) =>
      current.map((pickupType) => (pickupType.id === id ? nextPickupType : pickupType))
    );
  }

  async function removePickupType(id: string) {
    const response = await fetch(`/api/pickup-types/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete pickup type");
    }

    setPickupTypes((current) => current.filter((pickupType) => pickupType.id !== id));
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
          title="Pickup types master data"
          description="Manage pickup type references used by filters, builders, and component classification."
          rows={pickupTypes}
          searchPlaceholder="Search name, slug, coil count, description"
          summaryLabel="pickup types"
          getSearchText={(pickupType) =>
            [
              pickupType.name,
              pickupType.slug,
              pickupType.coilCount,
              pickupType.description,
              pickupType.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(pickupType) => pickupType.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create pickup type
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Coil Count</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(pickupType) => (
            <TableRow key={pickupType.id}>
              <TableCell className="font-medium">{pickupType.name}</TableCell>
              <TableCell>{pickupType.slug ?? "-"}</TableCell>
              <TableCell>{pickupType.coilCount ?? "-"}</TableCell>
              <TableCell className="max-w-80 truncate">
                {pickupType.description ?? "-"}
              </TableCell>
              <TableCell>
                <StatusPill
                  label={pickupType.isActive ? "Active" : "Inactive"}
                  tone={pickupType.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(pickupType)}
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
                    onClick={() => setDeleteTarget(pickupType)}
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
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              No pickup types match the current search.
            </TableCell>
          }
        />
      </section>

      <PickupTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create pickup type"
        description="Add a new pickup type master data record. Only name is required."
        submitLabel="Create pickup type"
        onSubmit={createPickupType}
      />

      <PickupTypeFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit pickup type"
        description="Update pickup type metadata used across the wiring reference."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updatePickupType(editTarget.id, value);
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
        title="Delete pickup type"
        description={`Delete ${deleteTarget?.name ?? "this pickup type"} from master data?`}
        confirmLabel="Delete pickup type"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removePickupType(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
