"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  Tag01Icon,
  ToggleOnIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { PotTypeFormDialog } from "@/components/pot-type-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type PotTypeInput, type PotTypeRow } from "@/lib/pot-type-types";

type PotTypeManagementContentProps = {
  initialPotTypes: PotTypeRow[];
};

export function PotTypeManagementContent({
  initialPotTypes,
}: PotTypeManagementContentProps) {
  const [potTypes, setPotTypes] = React.useState<PotTypeRow[]>(initialPotTypes);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<PotTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PotTypeRow | null>(null);

  const stats = [
    {
      title: "Total pots",
      value: String(potTypes.length),
      change: `${potTypes.filter((item) => item.isActive).length} active`,
      detail: "pot references available",
      icon: VolumeHighIcon,
    },
    {
      title: "Push options",
      value: String(
        potTypes.filter((item) => item.isPushPull || item.isPushPush).length
      ),
      change: "switching pot variants tracked",
      detail: "push pull and push push",
      icon: ToggleOnIcon,
    },
    {
      title: "Functions",
      value: String(
        new Set(potTypes.map((item) => item.potFunction).filter(Boolean)).size
      ),
      change: "volume, tone, blend",
      detail: "roles cataloged",
      icon: Tag01Icon,
    },
  ];

  async function createPotType(value: PotTypeInput) {
    const response = await fetch("/api/pot-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create pot type");
    }

    const nextPotType = (await response.json()) as PotTypeRow;
    setPotTypes((current) => [nextPotType, ...current]);
  }

  async function updatePotType(id: string, value: PotTypeInput) {
    const response = await fetch(`/api/pot-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update pot type");
    }

    const nextPotType = (await response.json()) as PotTypeRow;
    setPotTypes((current) =>
      current.map((item) => (item.id === id ? nextPotType : item))
    );
  }

  async function removePotType(id: string) {
    const response = await fetch(`/api/pot-types/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete pot type");
    }

    setPotTypes((current) => current.filter((item) => item.id !== id));
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
          title="Master potentiometer"
          description="Manage potentiometer references including value, taper, function, shaft type, and special switching features."
          rows={potTypes}
          searchPlaceholder="Search pot, value, taper, function, shaft"
          summaryLabel="potentiometers"
          getSearchText={(item) =>
            [
              item.name,
              item.valueLabel,
              item.valueOhm.toString(),
              item.taper,
              item.potFunction,
              item.shaftType,
              item.description,
              item.isPushPull ? "push pull" : null,
              item.isPushPush ? "push push" : null,
              item.isNoLoad ? "no load" : null,
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create potentiometer
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Taper</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Shaft</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{item.valueLabel}</span>
                  <span className="text-xs text-muted-foreground">{item.valueOhm} ohm</span>
                </div>
              </TableCell>
              <TableCell>{item.taper ?? "-"}</TableCell>
              <TableCell>{item.potFunction ?? "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {item.isPushPull ? <StatusPill label="Push Pull" tone="primary" /> : null}
                  {item.isPushPush ? <StatusPill label="Push Push" tone="primary" /> : null}
                  {item.isNoLoad ? <StatusPill label="No Load" tone="primary" /> : null}
                  {!item.isPushPull && !item.isPushPush && !item.isNoLoad ? (
                    <StatusPill label="Standard" tone="muted" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{item.shaftType ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={item.isActive ? "Active" : "Inactive"}
                  tone={item.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
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
            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
              No potentiometers match the current search.
            </TableCell>
          }
        />
      </section>

      <PotTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create potentiometer"
        description="Add a new potentiometer master data record."
        submitLabel="Create potentiometer"
        onSubmit={createPotType}
      />

      <PotTypeFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit potentiometer"
        description="Update potentiometer metadata used in builders and diagrams."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updatePotType(editTarget.id, value);
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
        title="Delete potentiometer"
        description={`Delete ${deleteTarget?.name ?? "this potentiometer"} from master data?`}
        confirmLabel="Delete potentiometer"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removePotType(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
