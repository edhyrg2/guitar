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

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { ResistorFormDialog } from "@/components/resistor-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type ResistorInput, type ResistorRow } from "@/lib/resistor-types";

type ResistorManagementContentProps = {
  initialResistors: ResistorRow[];
};

export function ResistorManagementContent({
  initialResistors,
}: ResistorManagementContentProps) {
  const [resistors, setResistors] = React.useState<ResistorRow[]>(initialResistors);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ResistorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ResistorRow | null>(null);

  const stats = [
    {
      title: "Total resistors",
      value: String(resistors.length),
      change: `${resistors.filter((item) => item.isActive).length} active`,
      detail: "resistor references available",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Wattage tagged",
      value: String(resistors.filter((item) => !!item.wattage).length),
      change: "power ratings available",
      detail: "useful for sourcing",
      icon: ToggleOnIcon,
    },
    {
      title: "Tolerance tagged",
      value: String(resistors.filter((item) => !!item.tolerance).length),
      change: "precision metadata available",
      detail: "1%, 5%, and more",
      icon: Tag01Icon,
    },
  ];

  async function createResistor(value: ResistorInput) {
    const response = await fetch("/api/resistors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create resistor");
    }

    const nextResistor = (await response.json()) as ResistorRow;
    setResistors((current) => [nextResistor, ...current]);
  }

  async function updateResistor(id: string, value: ResistorInput) {
    const response = await fetch(`/api/resistors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update resistor");
    }

    const nextResistor = (await response.json()) as ResistorRow;
    setResistors((current) =>
      current.map((item) => (item.id === id ? nextResistor : item))
    );
  }

  async function removeResistor(id: string) {
    const response = await fetch(`/api/resistors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete resistor");
    }

    setResistors((current) => current.filter((item) => item.id !== id));
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
          title="Master resistor"
          description="Manage resistor references including resistance value, wattage, tolerance, and status."
          rows={resistors}
          searchPlaceholder="Search resistor, value, wattage, tolerance"
          summaryLabel="resistors"
          getSearchText={(item) =>
            [
              item.valueLabel,
              item.valueOhm.toString(),
              item.wattage,
              item.tolerance,
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
              Create resistor
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Value Label</TableHead>
              <TableHead>Value Ohm</TableHead>
              <TableHead>Wattage</TableHead>
              <TableHead>Tolerance</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.valueLabel}</TableCell>
              <TableCell>{item.valueOhm}</TableCell>
              <TableCell>{item.wattage ?? "-"}</TableCell>
              <TableCell>{item.tolerance ?? "-"}</TableCell>
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
              No resistors match the current search.
            </TableCell>
          }
        />
      </section>

      <ResistorFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create resistor"
        description="Add a new resistor master data record."
        submitLabel="Create resistor"
        onSubmit={createResistor}
      />

      <ResistorFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit resistor"
        description="Update resistor metadata used in builders and parts references."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateResistor(editTarget.id, value);
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
        title="Delete resistor"
        description={`Delete ${deleteTarget?.valueLabel ?? "this resistor"} from master data?`}
        confirmLabel="Delete resistor"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeResistor(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
