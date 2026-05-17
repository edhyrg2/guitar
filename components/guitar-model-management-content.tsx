"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Calendar03Icon,
  Delete02Icon,
  MusicNote01Icon,
  PencilEdit02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { GuitarModelFormDialog } from "@/components/guitar-model-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type GuitarModelInput,
  type GuitarModelReference,
  type GuitarModelRow,
} from "@/lib/guitar-model-types";

type GuitarModelManagementContentProps = {
  initialGuitarModels: GuitarModelRow[];
  guitarBrandOptions: GuitarModelReference[];
};

export function GuitarModelManagementContent({
  initialGuitarModels,
  guitarBrandOptions,
}: GuitarModelManagementContentProps) {
  const [guitarModels, setGuitarModels] =
    React.useState<GuitarModelRow[]>(initialGuitarModels);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<GuitarModelRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GuitarModelRow | null>(null);

  const stats = [
    {
      title: "Total models",
      value: String(guitarModels.length),
      change: `${guitarModels.filter((model) => model.isActive).length} active`,
      detail: "guitar models available",
      icon: MusicNote01Icon,
    },
    {
      title: "Series tagged",
      value: String(guitarModels.filter((model) => !!model.series).length),
      change: "catalog families defined",
      detail: "useful for filtering",
      icon: Tag01Icon,
    },
    {
      title: "Year ranges",
      value: String(guitarModels.filter((model) => !!model.yearStart).length),
      change: "timeline metadata tracked",
      detail: "production windows noted",
      icon: Calendar03Icon,
    },
  ];

  async function createGuitarModel(value: GuitarModelInput) {
    const response = await fetch("/api/guitar-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create guitar model");
    }

    const nextModel = (await response.json()) as GuitarModelRow;
    setGuitarModels((current) => [nextModel, ...current]);
  }

  async function updateGuitarModel(id: string, value: GuitarModelInput) {
    const response = await fetch(`/api/guitar-models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update guitar model");
    }

    const nextModel = (await response.json()) as GuitarModelRow;
    setGuitarModels((current) =>
      current.map((model) => (model.id === id ? nextModel : model))
    );
  }

  async function removeGuitarModel(id: string) {
    const response = await fetch(`/api/guitar-models/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete guitar model");
    }

    setGuitarModels((current) => current.filter((model) => model.id !== id));
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
          title="Guitar models master data"
          description="Manage guitar model references including brand, series, body style, and default pickup configuration."
          rows={guitarModels}
          searchPlaceholder="Search model, brand, series, body type"
          summaryLabel="guitar models"
          getSearchText={(model) =>
            [
              model.name,
              model.slug,
              model.guitarBrandName,
              model.series,
              model.bodyType,
              model.defaultPickupConfig,
              model.description,
              model.yearStart?.toString(),
              model.yearEnd?.toString(),
              model.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(model) => model.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create guitar model
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Body Type</TableHead>
              <TableHead>Pickup Config</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(model) => (
            <TableRow key={model.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.slug ?? "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>{model.guitarBrandName}</TableCell>
              <TableCell>{model.series ?? "-"}</TableCell>
              <TableCell>
                {model.yearStart || model.yearEnd
                  ? `${model.yearStart ?? "-"} - ${model.yearEnd ?? "Now"}`
                  : "-"}
              </TableCell>
              <TableCell>{model.bodyType ?? "-"}</TableCell>
              <TableCell>{model.defaultPickupConfig ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={model.isActive ? "Active" : "Inactive"}
                  tone={model.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(model)}
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
                    onClick={() => setDeleteTarget(model)}
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
              No guitar models match the current search.
            </TableCell>
          }
        />
      </section>

      <GuitarModelFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create guitar model"
        description="Add a new guitar model and link it to an existing guitar brand."
        submitLabel="Create guitar model"
        guitarBrandOptions={guitarBrandOptions}
        onSubmit={createGuitarModel}
      />

      <GuitarModelFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit guitar model"
        description="Update guitar model metadata used across the catalog."
        submitLabel="Save changes"
        guitarBrandOptions={guitarBrandOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateGuitarModel(editTarget.id, value);
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
        title="Delete guitar model"
        description={`Delete ${deleteTarget?.name ?? "this guitar model"} from master data?`}
        confirmLabel="Delete guitar model"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeGuitarModel(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
