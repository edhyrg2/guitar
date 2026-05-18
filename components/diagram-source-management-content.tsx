"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  BookBookmark01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  Tag01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { DiagramSourceFormDialog } from "@/components/diagram-source-form-dialog";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type DiagramSourceInput,
  type DiagramSourceReference,
  type DiagramSourceRow,
} from "@/lib/diagram-source-types";

type DiagramSourceManagementContentProps = {
  initialDiagramSources: DiagramSourceRow[];
  wiringTemplateOptions: DiagramSourceReference[];
};

export function DiagramSourceManagementContent({
  initialDiagramSources,
  wiringTemplateOptions,
}: DiagramSourceManagementContentProps) {
  const [diagramSources, setDiagramSources] = React.useState<DiagramSourceRow[]>(
    initialDiagramSources
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<DiagramSourceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DiagramSourceRow | null>(
    null
  );

  const stats = [
    {
      title: "Total sources",
      value: String(diagramSources.length),
      change: "source records attached to templates",
      detail: "reference trail for wiring provenance",
      icon: BookBookmark01Icon,
    },
    {
      title: "Official sources",
      value: String(diagramSources.filter((item) => item.isOfficial).length),
      change: "factory or publisher-owned references",
      detail: "flagged as official references",
      icon: Tag01Icon,
    },
    {
      title: "Verified records",
      value: String(diagramSources.filter((item) => item.verifiedAt).length),
      change: "manually verified entries",
      detail: "timestamped source validation",
      icon: ViewIcon,
    },
  ];

  async function createDiagramSource(value: DiagramSourceInput) {
    const response = await fetch("/api/diagram-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create diagram source");
    }

    const nextDiagramSource = (await response.json()) as DiagramSourceRow;
    setDiagramSources((current) => [nextDiagramSource, ...current]);
  }

  async function updateDiagramSource(id: string, value: DiagramSourceInput) {
    const response = await fetch(`/api/diagram-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update diagram source");
    }

    const nextDiagramSource = (await response.json()) as DiagramSourceRow;
    setDiagramSources((current) =>
      current.map((item) => (item.id === id ? nextDiagramSource : item))
    );
  }

  async function removeDiagramSource(id: string) {
    const response = await fetch(`/api/diagram-sources/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete diagram source");
    }

    setDiagramSources((current) => current.filter((item) => item.id !== id));
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
          title="Diagram source registry"
          description="Manage provenance records for each wiring template, including official references, files, and verification notes."
          rows={diagramSources}
          searchPlaceholder="Search source, brand, template, type, notes"
          summaryLabel="diagram sources"
          getSearchText={(item) =>
            [
              item.sourceName,
              item.sourceBrand,
              item.wiringTemplateName,
              item.sourceType,
              item.sourceUrl,
              item.sourceFileUrl,
              item.licenseNotes,
              item.notes,
              item.isOfficial ? "official" : null,
              item.verifiedAt ? "verified" : null,
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create source
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Source Name</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Official</TableHead>
              <TableHead>Verified At</TableHead>
              <TableHead>Source URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.sourceName}</TableCell>
              <TableCell>{item.wiringTemplateName}</TableCell>
              <TableCell>{item.sourceBrand ?? "-"}</TableCell>
              <TableCell>{item.sourceType ?? "-"}</TableCell>
              <TableCell>{item.isOfficial ? "Yes" : "No"}</TableCell>
              <TableCell>
                {item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : "-"}
              </TableCell>
              <TableCell className="max-w-72 truncate">{item.sourceUrl ?? "-"}</TableCell>
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
              No diagram sources match the current search.
            </TableCell>
          }
        />
      </section>

      <DiagramSourceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create diagram source"
        description="Add a provenance record for a wiring template source page, file, or official reference."
        submitLabel="Create source"
        wiringTemplateOptions={wiringTemplateOptions}
        onSubmit={createDiagramSource}
      />

      <DiagramSourceFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit diagram source"
        description="Update the source metadata, verification state, and file references for this wiring template."
        submitLabel="Save changes"
        wiringTemplateOptions={wiringTemplateOptions}
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateDiagramSource(editTarget.id, value);
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
        title="Delete diagram source"
        description={`Delete ${deleteTarget?.sourceName ?? "this diagram source"} from the wiring source registry?`}
        confirmLabel="Delete source"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeDiagramSource(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
