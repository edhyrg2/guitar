"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  NoteIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { PickupConfigurationFormDialog } from "@/components/pickup-configuration-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type PickupConfigurationInput,
  type PickupConfigurationRow,
} from "@/lib/pickup-configuration-types";

type PickupConfigurationManagementContentProps = {
  initialConfigurations: PickupConfigurationRow[];
};

export function PickupConfigurationManagementContent({
  initialConfigurations,
}: PickupConfigurationManagementContentProps) {
  const [configurations, setConfigurations] =
    React.useState<PickupConfigurationRow[]>(initialConfigurations);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<PickupConfigurationRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<PickupConfigurationRow | null>(null);

  const stats = [
    {
      title: "Total configs",
      value: String(configurations.length),
      change: `${configurations.filter((item) => item.pickupCount >= 3).length} multi-pickup`,
      detail: "pickup layouts available",
      icon: Tag01Icon,
    },
    {
      title: "With middle",
      value: String(configurations.filter((item) => item.hasMiddle).length),
      change: "mid-position layouts tracked",
      detail: "useful for strat-style guitars",
      icon: ViewIcon,
    },
    {
      title: "Described",
      value: String(configurations.filter((item) => !!item.description).length),
      change: "context notes available",
      detail: "helps builders and filters",
      icon: NoteIcon,
    },
  ];

  async function createConfiguration(value: PickupConfigurationInput) {
    const response = await fetch("/api/pickup-configurations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create pickup configuration");
    }

    const nextConfiguration = (await response.json()) as PickupConfigurationRow;
    setConfigurations((current) => [nextConfiguration, ...current]);
  }

  async function updateConfiguration(
    id: string,
    value: PickupConfigurationInput
  ) {
    const response = await fetch(`/api/pickup-configurations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update pickup configuration");
    }

    const nextConfiguration = (await response.json()) as PickupConfigurationRow;
    setConfigurations((current) =>
      current.map((item) => (item.id === id ? nextConfiguration : item))
    );
  }

  async function removeConfiguration(id: string) {
    const response = await fetch(`/api/pickup-configurations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete pickup configuration");
    }

    setConfigurations((current) => current.filter((item) => item.id !== id));
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
          title="Master pickup configuration"
          description="Manage pickup layout codes used by guitar models, filters, and wiring references."
          rows={configurations}
          searchPlaceholder="Search code, name, description"
          summaryLabel="pickup configurations"
          getSearchText={(item) =>
            [
              item.code,
              item.name,
              item.description,
              item.pickupCount.toString(),
              item.hasNeck ? "neck" : null,
              item.hasMiddle ? "middle" : null,
              item.hasBridge ? "bridge" : null,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create configuration
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Pickup Count</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.code}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <StatusPill label={`${item.pickupCount} pickup`} tone="primary" />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label="Neck"
                    tone={item.hasNeck ? "primary" : "muted"}
                  />
                  <StatusPill
                    label="Middle"
                    tone={item.hasMiddle ? "primary" : "muted"}
                  />
                  <StatusPill
                    label="Bridge"
                    tone={item.hasBridge ? "primary" : "muted"}
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-72 truncate">
                {item.description ?? "-"}
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
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              No pickup configurations match the current search.
            </TableCell>
          }
        />
      </section>

      <PickupConfigurationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create pickup configuration"
        description="Add a new pickup layout code. Code and name are required."
        submitLabel="Create configuration"
        onSubmit={createConfiguration}
      />

      <PickupConfigurationFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit pickup configuration"
        description="Update pickup layout metadata used across the catalog."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateConfiguration(editTarget.id, value);
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
        title="Delete pickup configuration"
        description={`Delete ${deleteTarget?.code ?? "this pickup configuration"} from master data?`}
        confirmLabel="Delete configuration"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeConfiguration(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
