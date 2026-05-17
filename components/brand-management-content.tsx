"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  Globe02Icon,
  Location01Icon,
  PencilEdit02Icon,
  Store04Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { BrandFormDialog } from "@/components/brand-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type BrandInput, type BrandRow } from "@/lib/brand-types";

type BrandManagementContentProps = {
  initialBrands: BrandRow[];
};

export function BrandManagementContent({
  initialBrands,
}: BrandManagementContentProps) {
  const [brands, setBrands] = React.useState<BrandRow[]>(initialBrands);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<BrandRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BrandRow | null>(null);

  const stats = [
    {
      title: "Total brands",
      value: String(brands.length),
      change: `${brands.filter((brand) => brand.active).length} active`,
      detail: "brand records available",
      icon: Store04Icon,
    },
    {
      title: "With website",
      value: String(brands.filter((brand) => !!brand.website).length),
      change: "external reference ready",
      detail: "useful for source links",
      icon: Globe02Icon,
    },
    {
      title: "Types tagged",
      value: String(brands.filter((brand) => !!brand.type).length),
      change: "helps filtering",
      detail: "electric, acoustic, parts",
      icon: Tag01Icon,
    },
    {
      title: "Countries",
      value: String(new Set(brands.map((brand) => brand.country).filter(Boolean)).size),
      change: "regional origin tracked",
      detail: "optional metadata",
      icon: Location01Icon,
    },
  ];

  async function createBrand(value: BrandInput) {
    const response = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create brand");
    }

    const nextBrand = (await response.json()) as BrandRow;
    setBrands((current) => [nextBrand, ...current]);
  }

  async function updateBrand(id: string, value: BrandInput) {
    const response = await fetch(`/api/brands/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update brand");
    }

    const nextBrand = (await response.json()) as BrandRow;
    setBrands((current) =>
      current.map((brand) => (brand.id === id ? nextBrand : brand))
    );
  }

  async function removeBrand(id: string) {
    const response = await fetch(`/api/brands/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete brand");
    }

    setBrands((current) => current.filter((brand) => brand.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section>
        <DataTableCard
          title="Pickup brand master data"
          description="Manage pickup brand references used by diagrams, builders, and filters."
          rows={brands}
          searchPlaceholder="Search brand, slug, type, country"
          summaryLabel="brands"
          getSearchText={(brand) =>
            [
              brand.name,
              brand.slug,
              brand.type,
              brand.country,
              brand.website,
              brand.active ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(brand) => brand.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create brand
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(brand) => (
            <TableRow key={brand.id}>
              <TableCell className="font-medium">{brand.name}</TableCell>
              <TableCell>{brand.slug ?? "-"}</TableCell>
              <TableCell>
                <div className="flex size-7 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground">
                  {brand.logo ?? brand.name.slice(0, 2).toUpperCase()}
                </div>
              </TableCell>
              <TableCell className="max-w-44 truncate">
                {brand.website ?? "-"}
              </TableCell>
              <TableCell>{brand.type ?? "-"}</TableCell>
              <TableCell>{brand.country ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={brand.active ? "Active" : "Inactive"}
                  tone={brand.active ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(brand)}
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
                    onClick={() => setDeleteTarget(brand)}
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
              No brands match the current search.
            </TableCell>
          }
        />
      </section>

      <BrandFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create pickup brand"
        description="Add a new pickup brand master data record. Only name is required."
        submitLabel="Create pickup brand"
        onSubmit={createBrand}
      />

      <BrandFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit pickup brand"
        description="Update pickup brand metadata used across the wiring reference."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateBrand(editTarget.id, value);
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
        title="Delete pickup brand"
        description={`Delete ${deleteTarget?.name ?? "this pickup brand"} from master data?`}
        confirmLabel="Delete pickup brand"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeBrand(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
