"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  ElectricPlugsIcon,
  PencilEdit02Icon,
  Tag01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WiringTemplateConnectionFormDialog } from "@/components/wiring-template-connection-form-dialog";
import {
  type WiringTemplateConnectionInput,
  type WiringTemplateConnectionReference,
  type WiringTemplateConnectionRow,
} from "@/lib/wiring-template-connection-types";

type WiringTemplateConnectionManagementContentProps = {
  initialConnections: WiringTemplateConnectionRow[];
  wiringTemplateOptions: WiringTemplateConnectionReference[];
  wireTypeOptions: WiringTemplateConnectionReference[];
};

export function WiringTemplateConnectionManagementContent({
  initialConnections,
  wiringTemplateOptions,
  wireTypeOptions,
}: WiringTemplateConnectionManagementContentProps) {
  const [connections, setConnections] = React.useState<
    WiringTemplateConnectionRow[]
  >(initialConnections);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<WiringTemplateConnectionRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<WiringTemplateConnectionRow | null>(null);

  const stats = [
    {
      title: "Template connections",
      value: String(connections.length),
      change: "wire paths defined",
      detail: "connection records between components",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Templates covered",
      value: String(new Set(connections.map((item) => item.wiringTemplateId)).size),
      change: "templates with wiring connections",
      detail: "coverage across diagram blueprints",
      icon: ViewIcon,
    },
    {
      title: "Wire types used",
      value: String(new Set(connections.map((item) => item.wireTypeId)).size),
      change: "wire definitions linked",
      detail: "hot, ground, shield and more",
      icon: Tag01Icon,
    },
  ];

  async function createConnection(value: WiringTemplateConnectionInput) {
    const response = await fetch("/api/wiring-template-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create template connection");
    }

    const nextConnection = (await response.json()) as WiringTemplateConnectionRow;
    setConnections((current) => [nextConnection, ...current]);
  }

  async function updateConnection(id: string, value: WiringTemplateConnectionInput) {
    const response = await fetch(`/api/wiring-template-connections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update template connection");
    }

    const nextConnection = (await response.json()) as WiringTemplateConnectionRow;
    setConnections((current) =>
      current.map((item) => (item.id === id ? nextConnection : item))
    );
  }

  async function removeConnection(id: string) {
    const response = await fetch(`/api/wiring-template-connections/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete template connection");
    }

    setConnections((current) => current.filter((item) => item.id !== id));
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
          title="Wiring template connections"
          description="Manage wire connections between component roles in each template, including path geometry, wire type, labels, and notes."
          rows={connections}
          searchPlaceholder="Search template, roles, points, wire type, color"
          summaryLabel="template connections"
          getSearchText={(item) =>
            [
              item.wiringTemplateName,
              item.fromComponentRole,
              item.fromPointKey,
              item.toComponentRole,
              item.toPointKey,
              item.wireTypeName,
              item.wireColor,
              item.label,
              item.notes,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create connection
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Wire Type</TableHead>
              <TableHead>Wire Color</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.wiringTemplateName}</TableCell>
              <TableCell>
                {item.fromComponentRole} / {item.fromPointKey}
              </TableCell>
              <TableCell>
                {item.toComponentRole} / {item.toPointKey}
              </TableCell>
              <TableCell>{item.wireTypeName}</TableCell>
              <TableCell>{item.wireColor ?? "-"}</TableCell>
              <TableCell>{item.label ?? "-"}</TableCell>
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
              No template connections match the current search.
            </TableCell>
          }
        />
      </section>

      <WiringTemplateConnectionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create template connection"
        description="Add a new wire connection between component roles in a wiring template."
        submitLabel="Create connection"
        wiringTemplateOptions={wiringTemplateOptions}
        wireTypeOptions={wireTypeOptions}
        onSubmit={createConnection}
      />

      <WiringTemplateConnectionFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit template connection"
        description="Update wire path, type, and metadata for this template connection."
        submitLabel="Save changes"
        wiringTemplateOptions={wiringTemplateOptions}
        wireTypeOptions={wireTypeOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateConnection(editTarget.id, value);
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
        title="Delete template connection"
        description={`Delete ${deleteTarget?.label ?? "this template connection"} from the wiring map?`}
        confirmLabel="Delete connection"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeConnection(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
