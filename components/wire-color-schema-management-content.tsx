"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ColorPickerIcon,
  Delete02Icon,
  LinkSquare02Icon,
  PencilEdit02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WireColorSchemaFormDialog } from "@/components/wire-color-schema-form-dialog";
import {
  type WireColorSchemaInput,
  type WireColorSchemaReference,
  type WireColorSchemaRow,
} from "@/lib/wire-color-schema-types";

type WireColorSchemaManagementContentProps = {
  initialSchemas: WireColorSchemaRow[];
  brandOptions: WireColorSchemaReference[];
  pickupTypeOptions: WireColorSchemaReference[];
};

export function WireColorSchemaManagementContent({
  initialSchemas,
  brandOptions,
  pickupTypeOptions,
}: WireColorSchemaManagementContentProps) {
  const [schemas, setSchemas] = React.useState<WireColorSchemaRow[]>(initialSchemas);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<WireColorSchemaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WireColorSchemaRow | null>(null);

  const stats = [
    {
      title: "Total schemas",
      value: String(schemas.length),
      change: `${new Set(schemas.map((schema) => schema.pickupBrandId)).size} brands covered`,
      detail: "wire color mappings available",
      icon: ColorPickerIcon,
    },
    {
      title: "Pickup types",
      value: String(new Set(schemas.map((schema) => schema.pickupTypeId)).size),
      change: "schema variants grouped by type",
      detail: "single coil to active systems",
      icon: Tag01Icon,
    },
    {
      title: "Battery-aware",
      value: String(
        schemas.filter(
          (schema) => schema.batteryPositiveColor || schema.batteryNegativeColor
        ).length
      ),
      change: "active pickup power leads tracked",
      detail: "useful for onboard preamps",
      icon: LinkSquare02Icon,
    },
  ];

  async function createSchema(value: WireColorSchemaInput) {
    const response = await fetch("/api/wire-color-schemas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create wire color schema");
    }

    const nextSchema = (await response.json()) as WireColorSchemaRow;
    setSchemas((current) => [nextSchema, ...current]);
  }

  async function updateSchema(id: string, value: WireColorSchemaInput) {
    const response = await fetch(`/api/wire-color-schemas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update wire color schema");
    }

    const nextSchema = (await response.json()) as WireColorSchemaRow;
    setSchemas((current) =>
      current.map((schema) => (schema.id === id ? nextSchema : schema))
    );
  }

  async function removeSchema(id: string) {
    const response = await fetch(`/api/wire-color-schemas/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete wire color schema");
    }

    setSchemas((current) => current.filter((schema) => schema.id !== id));
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
          title="Master wire color schema"
          description="Manage pickup wire color mapping per pickup brand and pickup type."
          rows={schemas}
          searchPlaceholder="Search schema, brand, type, color, notes"
          summaryLabel="wire color schemas"
          getSearchText={(schema) =>
            [
              schema.name,
              schema.pickupBrandName,
              schema.pickupTypeName,
              schema.hotColor,
              schema.groundColor,
              schema.shieldColor,
              schema.northStartColor,
              schema.northFinishColor,
              schema.southStartColor,
              schema.southFinishColor,
              schema.batteryPositiveColor,
              schema.batteryNegativeColor,
              schema.notes,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(schema) => schema.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create schema
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Primary Colors</TableHead>
              <TableHead>Coil Leads</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(schema) => (
            <TableRow key={schema.id}>
              <TableCell className="font-medium">{schema.name}</TableCell>
              <TableCell>{schema.pickupBrandName}</TableCell>
              <TableCell>{schema.pickupTypeName}</TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span>Hot: {schema.hotColor ?? "-"}</span>
                  <span>Ground: {schema.groundColor ?? "-"}</span>
                  <span>Shield: {schema.shieldColor ?? "-"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span>N Start: {schema.northStartColor ?? "-"}</span>
                  <span>N Finish: {schema.northFinishColor ?? "-"}</span>
                  <span>S Start: {schema.southStartColor ?? "-"}</span>
                  <span>S Finish: {schema.southFinishColor ?? "-"}</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusPill
                  label={
                    schema.batteryPositiveColor || schema.batteryNegativeColor
                      ? `${schema.batteryPositiveColor ?? "-"} / ${schema.batteryNegativeColor ?? "-"}`
                      : "None"
                  }
                  tone={
                    schema.batteryPositiveColor || schema.batteryNegativeColor
                      ? "primary"
                      : "muted"
                  }
                />
              </TableCell>
              <TableCell className="max-w-56 truncate">{schema.notes ?? "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(schema)}
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
                    onClick={() => setDeleteTarget(schema)}
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
              No wire color schemas match the current search.
            </TableCell>
          }
        />
      </section>

      <WireColorSchemaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create wire color schema"
        description="Add a new wire color schema for a pickup brand and pickup type combination."
        submitLabel="Create schema"
        brandOptions={brandOptions}
        pickupTypeOptions={pickupTypeOptions}
        onSubmit={createSchema}
      />

      <WireColorSchemaFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit wire color schema"
        description="Update conductor colors and notes used in wiring references."
        submitLabel="Save changes"
        brandOptions={brandOptions}
        pickupTypeOptions={pickupTypeOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateSchema(editTarget.id, value);
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
        title="Delete wire color schema"
        description={`Delete ${deleteTarget?.name ?? "this wire color schema"} from master data?`}
        confirmLabel="Delete schema"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeSchema(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
