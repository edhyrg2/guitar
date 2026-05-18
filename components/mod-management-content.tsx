"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  Settings01Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { AssetEditorButton } from "@/components/asset-editor-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { ModFormDialog } from "@/components/mod-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type ModInput, type ModRow } from "@/lib/mod-types";

type ModManagementContentProps = {
  initialMods: ModRow[];
};

export function ModManagementContent({
  initialMods,
}: ModManagementContentProps) {
  const [mods, setMods] = React.useState<ModRow[]>(initialMods);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ModRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ModRow | null>(null);

  const stats = [
    {
      title: "Total mods",
      value: String(mods.length),
      change: `${mods.filter((item) => item.isActive).length} active`,
      detail: "accessory and wiring mods available",
      icon: Settings01Icon,
    },
    {
      title: "Switching required",
      value: String(
        mods.filter(
          (item) =>
            item.requiresPushPull ||
            item.requiresMiniToggle ||
            item.requiresSpecialSwitch
        ).length
      ),
      change: "need extra switching hardware",
      detail: "useful for planning parts lists",
      icon: ToggleOnIcon,
    },
    {
      title: "Advanced mods",
      value: String(
        mods.filter(
          (item) => item.difficultyLevel?.toLowerCase() === "advanced"
        ).length
      ),
      change: "higher complexity entries",
      detail: "good for workshop review",
      icon: PencilEdit02Icon,
    },
  ];

  async function createMod(value: ModInput) {
    const response = await fetch("/api/mods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create mod");
    }

    const nextMod = (await response.json()) as ModRow;
    setMods((current) => [nextMod, ...current]);
  }

  async function updateMod(id: string, value: ModInput) {
    const response = await fetch(`/api/mods/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update mod");
    }

    const nextMod = (await response.json()) as ModRow;
    setMods((current) =>
      current.map((item) => (item.id === id ? nextMod : item))
    );
  }

  async function removeMod(id: string) {
    const response = await fetch(`/api/mods/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete mod");
    }

    setMods((current) => current.filter((item) => item.id !== id));
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
          title="Master accessory / mod"
          description="Manage accessory and wiring mod references, required switching parts, and difficulty level."
          rows={mods}
          searchPlaceholder="Search mod, slug, difficulty, description"
          summaryLabel="mods"
          getSearchText={(item) =>
            [
              item.name,
              item.slug,
              item.description,
              item.difficultyLevel,
              item.requiresPushPull ? "push pull" : null,
              item.requiresMiniToggle ? "mini toggle" : null,
              item.requiresSpecialSwitch ? "special switch" : null,
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create mod
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead>Description</TableHead>
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
              <TableCell>{item.difficultyLevel ?? "-"}</TableCell>
              <TableCell className="max-w-72 whitespace-normal">
                {[
                  item.requiresPushPull ? "Push Pull" : null,
                  item.requiresMiniToggle ? "Mini Toggle" : null,
                  item.requiresSpecialSwitch ? "Special Switch" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </TableCell>
              <TableCell className="max-w-72 truncate">{item.description ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={item.isActive ? "Active" : "Inactive"}
                  tone={item.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <AssetEditorButton ownerType="mod" ownerId={item.id} />
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
              No mods match the current search.
            </TableCell>
          }
        />
      </section>

      <ModFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create accessory / mod"
        description="Add a new accessory or wiring modification to master data."
        submitLabel="Create mod"
        onSubmit={createMod}
      />

      <ModFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit accessory / mod"
        description="Update mod metadata used in planning, wiring references, and builders."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateMod(editTarget.id, value);
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
        title="Delete accessory / mod"
        description={`Delete ${deleteTarget?.name ?? "this mod"} from master data?`}
        confirmLabel="Delete mod"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeMod(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
