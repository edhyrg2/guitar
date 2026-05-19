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
import { WiringTemplateFormDialog } from "@/components/wiring-template-form-dialog";
import {
  formatWiringTemplateInventorySummary,
  parseWiringTemplateInventory,
} from "@/lib/wiring-template-inventory";
import {
  type WiringTemplateInput,
  type WiringTemplateReference,
  type WiringTemplateRow,
} from "@/lib/wiring-template-types";

type WiringTemplateManagementContentProps = {
  initialTemplates: WiringTemplateRow[];
  pickupConfigurationOptions: WiringTemplateReference[];
  switchTypeOptions: WiringTemplateReference[];
};

export function WiringTemplateManagementContent({
  initialTemplates,
  pickupConfigurationOptions,
  switchTypeOptions,
}: WiringTemplateManagementContentProps) {
  const [templates, setTemplates] = React.useState<WiringTemplateRow[]>(
    initialTemplates
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<WiringTemplateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WiringTemplateRow | null>(
    null
  );
  const templatesWithInventory = React.useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        inventory: parseWiringTemplateInventory(
          template.diagramJson,
          template.switchLogicJson
        ),
      })),
    [templates]
  );

  const stats = [
    {
      title: "Total templates",
      value: String(templates.length),
      change: `${templates.filter((item) => item.isVerified).length} verified`,
      detail: "wiring blueprints available",
      icon: ViewIcon,
    },
    {
      title: "Switch mapped",
      value: String(new Set(templates.map((item) => item.switchTypeId)).size),
      change: "switch families covered",
      detail: "templates grouped by selector logic",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Configurations",
      value: String(
        new Set(templates.map((item) => item.pickupConfigurationId)).size
      ),
      change: "pickup layouts supported",
      detail: "coverage across pickup configs",
      icon: Tag01Icon,
    },
  ];

  async function createTemplate(value: WiringTemplateInput) {
    const response = await fetch("/api/wiring-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create wiring template");
    }

    const nextTemplate = (await response.json()) as WiringTemplateRow;
    setTemplates((current) => [nextTemplate, ...current]);
  }

  async function updateTemplate(id: string, value: WiringTemplateInput) {
    const response = await fetch(`/api/wiring-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update wiring template");
    }

    const nextTemplate = (await response.json()) as WiringTemplateRow;
    setTemplates((current) =>
      current.map((item) => (item.id === id ? nextTemplate : item))
    );
  }

  async function removeTemplate(id: string) {
    const response = await fetch(`/api/wiring-templates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete wiring template");
    }

    setTemplates((current) => current.filter((item) => item.id !== id));
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
          title="Master wiring template"
          description="Manage reusable wiring blueprints with diagram JSON, switch logic, and metadata for validation."
          rows={templatesWithInventory}
          searchPlaceholder="Search template, config, switch, source, creator"
          summaryLabel="wiring templates"
          getSearchText={(item) =>
            [
              item.name,
              item.slug,
              item.description,
              item.pickupConfigurationName,
              item.switchTypeName,
              item.difficultyLevel,
              item.sourceType,
              item.sourceUrl,
              item.createdBy,
              item.isVerified ? "verified" : "draft",
              formatWiringTemplateInventorySummary(item.inventory),
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create template
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pickup Config</TableHead>
              <TableHead>Switch Type</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Controls</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.pickupConfigurationName}</TableCell>
              <TableCell>{item.switchTypeName}</TableCell>
              <TableCell className="max-w-72">
                <div className="truncate">
                  {formatWiringTemplateInventorySummary(item.inventory) || "-"}
                </div>
              </TableCell>
              <TableCell>
                {item.volumeCount} Vol / {item.toneCount} Tone
              </TableCell>
              <TableCell>{item.difficultyLevel ?? "-"}</TableCell>
              <TableCell>{item.isVerified ? "Yes" : "No"}</TableCell>
              <TableCell>{item.createdBy}</TableCell>
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
            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
              No wiring templates match the current search.
            </TableCell>
          }
        />
      </section>

      <WiringTemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create wiring template"
        description="Add a new reusable diagram template with JSON structure and switch logic."
        submitLabel="Create template"
        pickupConfigurationOptions={pickupConfigurationOptions}
        switchTypeOptions={switchTypeOptions}
        onSubmit={createTemplate}
      />

      <WiringTemplateFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit wiring template"
        description="Update template structure, validation metadata, and linked hardware configuration."
        submitLabel="Save changes"
        pickupConfigurationOptions={pickupConfigurationOptions}
        switchTypeOptions={switchTypeOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateTemplate(editTarget.id, value);
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
        title="Delete wiring template"
        description={`Delete ${deleteTarget?.name ?? "this wiring template"} from master data?`}
        confirmLabel="Delete template"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeTemplate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
