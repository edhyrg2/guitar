"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  LibraryIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WiringTemplateComponentFormDialog } from "@/components/wiring-template-component-form-dialog";
import {
  type WiringTemplateComponentInput,
  type WiringTemplateComponentReference,
  type WiringTemplateComponentRow,
} from "@/lib/wiring-template-component-types";

type WiringTemplateComponentManagementContentProps = {
  initialComponents: WiringTemplateComponentRow[];
  wiringTemplateOptions: WiringTemplateComponentReference[];
  assetOptions: WiringTemplateComponentReference[];
};

export function WiringTemplateComponentManagementContent({
  initialComponents,
  wiringTemplateOptions,
  assetOptions,
}: WiringTemplateComponentManagementContentProps) {
  const [components, setComponents] = React.useState<WiringTemplateComponentRow[]>(
    initialComponents
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<WiringTemplateComponentRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<WiringTemplateComponentRow | null>(null);

  const stats = [
    {
      title: "Template components",
      value: String(components.length),
      change: "components placed in templates",
      detail: "diagram layout records available",
      icon: LibraryIcon,
    },
    {
      title: "Templates covered",
      value: String(new Set(components.map((item) => item.wiringTemplateId)).size),
      change: "templates with component placement",
      detail: "coverage across wiring blueprints",
      icon: ViewIcon,
    },
    {
      title: "Roles used",
      value: String(new Set(components.map((item) => item.componentRole)).size),
      change: "roles assigned in layouts",
      detail: "switch, volume, selector, and more",
      icon: Tag01Icon,
    },
  ];

  async function createComponent(value: WiringTemplateComponentInput) {
    const response = await fetch("/api/wiring-template-components", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create template component");
    }

    const nextComponent = (await response.json()) as WiringTemplateComponentRow;
    setComponents((current) => [nextComponent, ...current]);
  }

  async function updateComponent(id: string, value: WiringTemplateComponentInput) {
    const response = await fetch(`/api/wiring-template-components/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update template component");
    }

    const nextComponent = (await response.json()) as WiringTemplateComponentRow;
    setComponents((current) =>
      current.map((item) => (item.id === id ? nextComponent : item))
    );
  }

  async function removeComponent(id: string) {
    const response = await fetch(`/api/wiring-template-components/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete template component");
    }

    setComponents((current) => current.filter((item) => item.id !== id));
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
          title="Wiring template components"
          description="Manage component placement records inside wiring templates, including asset selection, coordinates, rotation, and metadata."
          rows={components}
          searchPlaceholder="Search template, role, type, asset"
          summaryLabel="template components"
          getSearchText={(item) =>
            [
              item.wiringTemplateName,
              item.componentRole,
              item.componentType,
              item.assetName,
              item.metadataJson,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create component
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>X</TableHead>
              <TableHead>Y</TableHead>
              <TableHead>Rotation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.wiringTemplateName}</TableCell>
              <TableCell>{item.componentRole}</TableCell>
              <TableCell>{item.componentType}</TableCell>
              <TableCell>{item.assetName}</TableCell>
              <TableCell>{item.positionX}</TableCell>
              <TableCell>{item.positionY}</TableCell>
              <TableCell>{item.rotation}</TableCell>
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
              No template components match the current search.
            </TableCell>
          }
        />
      </section>

      <WiringTemplateComponentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create template component"
        description="Add a component placement record to a wiring template."
        submitLabel="Create component"
        wiringTemplateOptions={wiringTemplateOptions}
        assetOptions={assetOptions}
        onSubmit={createComponent}
      />

      <WiringTemplateComponentFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit template component"
        description="Update role, asset, placement, and metadata for this template component."
        submitLabel="Save changes"
        wiringTemplateOptions={wiringTemplateOptions}
        assetOptions={assetOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateComponent(editTarget.id, value);
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
        title="Delete template component"
        description={`Delete ${deleteTarget?.componentRole ?? "this template component"} from the wiring layout?`}
        confirmLabel="Delete component"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeComponent(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
