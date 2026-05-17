"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  ElectricPlugsIcon,
  LibraryIcon,
  PencilEdit02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { ComponentConnectionPointFormDialog } from "@/components/component-connection-point-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type ComponentConnectionPointInput,
  type ComponentConnectionPointReference,
  type ComponentConnectionPointRow,
} from "@/lib/component-connection-point-types";

type ComponentConnectionPointManagementContentProps = {
  initialComponentConnectionPoints: ComponentConnectionPointRow[];
  componentAssetOptions: ComponentConnectionPointReference[];
};

export function ComponentConnectionPointManagementContent({
  initialComponentConnectionPoints,
  componentAssetOptions,
}: ComponentConnectionPointManagementContentProps) {
  const [points, setPoints] = React.useState<ComponentConnectionPointRow[]>(
    initialComponentConnectionPoints
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<ComponentConnectionPointRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<ComponentConnectionPointRow | null>(null);

  const stats = [
    {
      title: "Total points",
      value: String(points.length),
      change: "mapped solder and lug locations",
      detail: "used for diagram placement",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Assets covered",
      value: String(new Set(points.map((item) => item.componentAssetId)).size),
      change: "component assets have point maps",
      detail: "coverage across SVG components",
      icon: LibraryIcon,
    },
    {
      title: "Point types",
      value: String(new Set(points.map((item) => item.pointType)).size),
      change: "lug, common, output and more",
      detail: "connection semantics available",
      icon: Tag01Icon,
    },
  ];

  async function createPoint(value: ComponentConnectionPointInput) {
    const response = await fetch("/api/component-connection-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create connection point");
    }

    const nextPoint = (await response.json()) as ComponentConnectionPointRow;
    setPoints((current) => [nextPoint, ...current]);
  }

  async function updatePoint(id: string, value: ComponentConnectionPointInput) {
    const response = await fetch(`/api/component-connection-points/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update connection point");
    }

    const nextPoint = (await response.json()) as ComponentConnectionPointRow;
    setPoints((current) =>
      current.map((item) => (item.id === id ? nextPoint : item))
    );
  }

  async function removePoint(id: string) {
    const response = await fetch(`/api/component-connection-points/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete connection point");
    }

    setPoints((current) => current.filter((item) => item.id !== id));
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
          title="Master connection point"
          description="Manage solder and lug points for component assets, including labels, point types, and coordinates."
          rows={points}
          searchPlaceholder="Search asset, label, point key, point type"
          summaryLabel="connection points"
          getSearchText={(item) =>
            [
              item.componentAssetName,
              item.pointKey,
              item.label,
              item.pointType,
              item.description,
              item.x.toString(),
              item.y.toString(),
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create point
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Component Asset</TableHead>
              <TableHead>Point Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Point Type</TableHead>
              <TableHead>X</TableHead>
              <TableHead>Y</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.componentAssetName}</TableCell>
              <TableCell>{item.pointKey}</TableCell>
              <TableCell>{item.label}</TableCell>
              <TableCell>{item.pointType}</TableCell>
              <TableCell>{item.x}</TableCell>
              <TableCell>{item.y}</TableCell>
              <TableCell className="max-w-72 truncate">{item.description ?? "-"}</TableCell>
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
              No connection points match the current search.
            </TableCell>
          }
        />
      </section>

      <ComponentConnectionPointFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create connection point"
        description="Add a new solder or lug point for a component asset."
        submitLabel="Create point"
        componentAssetOptions={componentAssetOptions}
        onSubmit={createPoint}
      />

      <ComponentConnectionPointFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit connection point"
        description="Update mapping coordinates and metadata for this component point."
        submitLabel="Save changes"
        componentAssetOptions={componentAssetOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updatePoint(editTarget.id, value);
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
        title="Delete connection point"
        description={`Delete ${deleteTarget?.label ?? "this connection point"} from wiring master data?`}
        confirmLabel="Delete point"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removePoint(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
