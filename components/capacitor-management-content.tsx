"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  ElectricPlugsIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { CapacitorFormDialog } from "@/components/capacitor-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type CapacitorInput, type CapacitorRow } from "@/lib/capacitor-types";

type CapacitorManagementContentProps = {
  initialCapacitors: CapacitorRow[];
};

export function CapacitorManagementContent({
  initialCapacitors,
}: CapacitorManagementContentProps) {
  const [capacitors, setCapacitors] = React.useState<CapacitorRow[]>(initialCapacitors);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<CapacitorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CapacitorRow | null>(null);

  const stats = [
    {
      title: "Total capacitors",
      value: String(capacitors.length),
      change: `${capacitors.filter((item) => item.isActive).length} active`,
      detail: "capacitor references available",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Types",
      value: String(new Set(capacitors.map((item) => item.type).filter(Boolean)).size),
      change: "film, ceramic, paper in oil",
      detail: "construction variants tracked",
      icon: Tag01Icon,
    },
    {
      title: "Voltage tagged",
      value: String(capacitors.filter((item) => !!item.voltageRating).length),
      change: "rating metadata available",
      detail: "helpful for sourcing",
      icon: ToggleOnIcon,
    },
  ];

  async function createCapacitor(value: CapacitorInput) {
    const response = await fetch("/api/capacitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create capacitor");
    }

    const nextCapacitor = (await response.json()) as CapacitorRow;
    setCapacitors((current) => [nextCapacitor, ...current]);
  }

  async function updateCapacitor(id: string, value: CapacitorInput) {
    const response = await fetch(`/api/capacitors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update capacitor");
    }

    const nextCapacitor = (await response.json()) as CapacitorRow;
    setCapacitors((current) =>
      current.map((item) => (item.id === id ? nextCapacitor : item))
    );
  }

  async function removeCapacitor(id: string) {
    const response = await fetch(`/api/capacitors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete capacitor");
    }

    setCapacitors((current) => current.filter((item) => item.id !== id));
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
          title="Master capacitor"
          description="Manage capacitor references including capacitance value, type, voltage rating, and status."
          rows={capacitors}
          searchPlaceholder="Search value, type, voltage, description"
          summaryLabel="capacitors"
          getSearchText={(item) =>
            [
              item.valueLabel,
              item.valueFarads.toString(),
              item.type,
              item.voltageRating,
              item.description,
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create capacitor
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Value Label</TableHead>
              <TableHead>Value Farads</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Voltage Rating</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.valueLabel}</TableCell>
              <TableCell>{item.valueFarads}</TableCell>
              <TableCell>{item.type ?? "-"}</TableCell>
              <TableCell>{item.voltageRating ?? "-"}</TableCell>
              <TableCell className="max-w-72 truncate">{item.description ?? "-"}</TableCell>
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
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              No capacitors match the current search.
            </TableCell>
          }
        />
      </section>

      <CapacitorFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create capacitor"
        description="Add a new capacitor master data record."
        submitLabel="Create capacitor"
        onSubmit={createCapacitor}
      />

      <CapacitorFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit capacitor"
        description="Update capacitor metadata used in builders and parts references."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateCapacitor(editTarget.id, value);
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
        title="Delete capacitor"
        description={`Delete ${deleteTarget?.valueLabel ?? "this capacitor"} from master data?`}
        confirmLabel="Delete capacitor"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeCapacitor(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
