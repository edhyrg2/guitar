"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ColorPickerIcon,
  Delete02Icon,
  ElectricPlugsIcon,
  PencilEdit02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WireTypeFormDialog } from "@/components/wire-type-form-dialog";
import { type WireTypeInput, type WireTypeRow } from "@/lib/wire-type-types";

type WireTypeManagementContentProps = {
  initialWireTypes: WireTypeRow[];
};

export function WireTypeManagementContent({
  initialWireTypes,
}: WireTypeManagementContentProps) {
  const [wireTypes, setWireTypes] = React.useState<WireTypeRow[]>(initialWireTypes);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<WireTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WireTypeRow | null>(null);

  const stats = [
    {
      title: "Total wire types",
      value: String(wireTypes.length),
      change: "wire references available",
      detail: "used for color and function mapping",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Shielded",
      value: String(wireTypes.filter((item) => item.isShielded).length),
      change: "shield or braided entries",
      detail: "useful for noise control references",
      icon: Tag01Icon,
    },
    {
      title: "Ground wires",
      value: String(wireTypes.filter((item) => item.isGround).length),
      change: "ground-designated entries",
      detail: "ground path metadata available",
      icon: ColorPickerIcon,
    },
  ];

  async function createWireType(value: WireTypeInput) {
    const response = await fetch("/api/wire-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create wire type");
    }

    const nextWireType = (await response.json()) as WireTypeRow;
    setWireTypes((current) => [nextWireType, ...current]);
  }

  async function updateWireType(id: string, value: WireTypeInput) {
    const response = await fetch(`/api/wire-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update wire type");
    }

    const nextWireType = (await response.json()) as WireTypeRow;
    setWireTypes((current) =>
      current.map((item) => (item.id === id ? nextWireType : item))
    );
  }

  async function removeWireType(id: string) {
    const response = await fetch(`/api/wire-types/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete wire type");
    }

    setWireTypes((current) => current.filter((item) => item.id !== id));
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
          title="Master wire type"
          description="Manage wire color, function, shielding, and grounding metadata used in wiring diagrams."
          rows={wireTypes}
          searchPlaceholder="Search wire type, color, function, hex"
          summaryLabel="wire types"
          getSearchText={(item) =>
            [
              item.name,
              item.color,
              item.hexColor,
              item.wireFunction,
              item.description,
              item.isShielded ? "shielded" : null,
              item.isGround ? "ground" : null,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create wire type
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Hex</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Shielded</TableHead>
              <TableHead>Ground</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.color ?? "-"}</TableCell>
              <TableCell>{item.hexColor ?? "-"}</TableCell>
              <TableCell>{item.wireFunction ?? "-"}</TableCell>
              <TableCell>{item.isShielded ? "Yes" : "No"}</TableCell>
              <TableCell>{item.isGround ? "Yes" : "No"}</TableCell>
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
              No wire types match the current search.
            </TableCell>
          }
        />
      </section>

      <WireTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create wire type"
        description="Add a new wire type for wiring color and function references."
        submitLabel="Create wire type"
        onSubmit={createWireType}
      />

      <WireTypeFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit wire type"
        description="Update wire color and function metadata used in diagrams."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateWireType(editTarget.id, value);
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
        title="Delete wire type"
        description={`Delete ${deleteTarget?.name ?? "this wire type"} from wiring master data?`}
        confirmLabel="Delete wire type"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeWireType(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
