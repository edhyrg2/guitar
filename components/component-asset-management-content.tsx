"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  LibraryIcon,
  PencilEdit02Icon,
  PictureInPictureOnIcon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { ComponentAssetFormDialog } from "@/components/component-asset-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type ComponentAssetRow,
  type ComponentAssetSubmitValue,
} from "@/lib/component-asset-types";

type ComponentAssetManagementContentProps = {
  initialComponentAssets: ComponentAssetRow[];
};

export function ComponentAssetManagementContent({
  initialComponentAssets,
}: ComponentAssetManagementContentProps) {
  const [componentAssets, setComponentAssets] = React.useState<ComponentAssetRow[]>(
    initialComponentAssets
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ComponentAssetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ComponentAssetRow | null>(null);

  function buildComponentAssetFormData(value: ComponentAssetSubmitValue) {
    const formData = new FormData();
    const { data } = value;

    formData.append("componentType", data.componentType);
    formData.append("name", data.name);
    formData.append("slug", data.slug ?? "");
    formData.append("svgUrl", data.svgUrl ?? "");
    formData.append("thumbnailUrl", data.thumbnailUrl ?? "");
    formData.append("width", data.width === null ? "" : String(data.width));
    formData.append("height", data.height === null ? "" : String(data.height));
    formData.append("anchorPointsJson", data.anchorPointsJson ?? "");
    formData.append("styleType", data.styleType ?? "");
    formData.append("isActive", String(data.isActive));

    if (value.svgFile) {
      formData.append("svgFile", value.svgFile);
    }

    if (value.thumbnailFile) {
      formData.append("thumbnailFile", value.thumbnailFile);
    }

    return formData;
  }

  const stats = [
    {
      title: "Total assets",
      value: String(componentAssets.length),
      change: `${componentAssets.filter((item) => item.isActive).length} active`,
      detail: "SVG and thumbnail references available",
      icon: LibraryIcon,
    },
    {
      title: "Component types",
      value: String(
        new Set(componentAssets.map((item) => item.componentType).filter(Boolean)).size
      ),
      change: "switches, pots, jacks, pickups",
      detail: "asset groups currently tracked",
      icon: PictureInPictureOnIcon,
    },
    {
      title: "Anchors mapped",
      value: String(componentAssets.filter((item) => !!item.anchorPointsJson).length),
      change: "ready for diagram positioning",
      detail: "helpful for wire snapping and labels",
      icon: ToggleOnIcon,
    },
  ];

  async function createComponentAsset(value: ComponentAssetSubmitValue) {
    const response = await fetch("/api/component-assets", {
      method: "POST",
      body: buildComponentAssetFormData(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create component asset");
    }

    const nextComponentAsset = (await response.json()) as ComponentAssetRow;
    setComponentAssets((current) => [nextComponentAsset, ...current]);
  }

  async function updateComponentAsset(id: string, value: ComponentAssetSubmitValue) {
    const response = await fetch(`/api/component-assets/${id}`, {
      method: "PUT",
      body: buildComponentAssetFormData(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update component asset");
    }

    const nextComponentAsset = (await response.json()) as ComponentAssetRow;
    setComponentAssets((current) =>
      current.map((item) => (item.id === id ? nextComponentAsset : item))
    );
  }

  async function removeComponentAsset(id: string) {
    const response = await fetch(`/api/component-assets/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete component asset");
    }

    setComponentAssets((current) => current.filter((item) => item.id !== id));
  }

  function getPreviewSrc(item: ComponentAssetRow) {
    return item.thumbnailUrl ?? item.svgUrl;
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
          title="Master component asset"
          description="Manage SVG and thumbnail assets for components, including size, anchor points, and style metadata."
          rows={componentAssets}
          searchPlaceholder="Search asset, component type, slug, style"
          summaryLabel="component assets"
          getSearchText={(item) =>
            [
              item.componentType,
              item.name,
              item.slug,
              item.svgUrl,
              item.thumbnailUrl,
              item.styleType,
              item.anchorPointsJson,
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create asset
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
                  {getPreviewSrc(item) ? (
                    <Image
                      src={getPreviewSrc(item) ?? ""}
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
              <TableCell>{item.componentType}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.slug ?? "-"}</TableCell>
              <TableCell>
                {item.width ?? "-"} x {item.height ?? "-"}
              </TableCell>
              <TableCell>{item.styleType ?? "-"}</TableCell>
              <TableCell className="max-w-72 truncate">
                {item.svgUrl ?? item.thumbnailUrl ?? "-"}
              </TableCell>
              <TableCell>
                <StatusPill
                  label={item.isActive ? "Active" : "Inactive"}
                  tone={item.isActive ? "primary" : "muted"}
                />
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
            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
              No component assets match the current search.
            </TableCell>
          }
        />
      </section>

      <ComponentAssetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create component asset"
        description="Add a new SVG or thumbnail asset for a component."
        submitLabel="Create asset"
        onSubmit={createComponentAsset}
      />

      <ComponentAssetFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit component asset"
        description="Update component asset metadata used in diagrams and builders."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateComponentAsset(editTarget.id, value);
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
        title="Delete component asset"
        description={`Delete ${deleteTarget?.name ?? "this component asset"} from master data?`}
        confirmLabel="Delete asset"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeComponentAsset(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
