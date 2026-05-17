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
} from "@hugeicons/core-free-icons";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTableCard } from "@/components/data-table-card";
import { GuitarBrandFormDialog } from "@/components/guitar-brand-form-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  type GuitarBrandInput,
  type GuitarBrandRow,
} from "@/lib/guitar-brand-types";

type GuitarBrandManagementContentProps = {
  initialGuitarBrands: GuitarBrandRow[];
};

export function GuitarBrandManagementContent({
  initialGuitarBrands,
}: GuitarBrandManagementContentProps) {
  const [guitarBrands, setGuitarBrands] =
    React.useState<GuitarBrandRow[]>(initialGuitarBrands);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<GuitarBrandRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GuitarBrandRow | null>(null);

  const stats = [
    {
      title: "Total brands",
      value: String(guitarBrands.length),
      change: `${guitarBrands.filter((brand) => brand.isActive).length} active`,
      detail: "guitar brand records available",
      icon: Store04Icon,
    },
    {
      title: "With website",
      value: String(guitarBrands.filter((brand) => !!brand.website).length),
      change: "external reference ready",
      detail: "useful for source links",
      icon: Globe02Icon,
    },
    {
      title: "Countries",
      value: String(
        new Set(guitarBrands.map((brand) => brand.country).filter(Boolean)).size
      ),
      change: "regional origin tracked",
      detail: "brand headquarters reference",
      icon: Location01Icon,
    },
  ];

  async function createGuitarBrand(value: GuitarBrandInput) {
    const response = await fetch("/api/guitar-brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to create guitar brand");
    }

    const nextBrand = (await response.json()) as GuitarBrandRow;
    setGuitarBrands((current) => [nextBrand, ...current]);
  }

  async function updateGuitarBrand(id: string, value: GuitarBrandInput) {
    const response = await fetch(`/api/guitar-brands/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error("Failed to update guitar brand");
    }

    const nextBrand = (await response.json()) as GuitarBrandRow;
    setGuitarBrands((current) =>
      current.map((brand) => (brand.id === id ? nextBrand : brand))
    );
  }

  async function removeGuitarBrand(id: string) {
    const response = await fetch(`/api/guitar-brands/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete guitar brand");
    }

    setGuitarBrands((current) => current.filter((brand) => brand.id !== id));
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
          title="Guitar brand master data"
          description="Manage guitar brand references used by catalog, builders, and product metadata."
          rows={guitarBrands}
          searchPlaceholder="Search brand, slug, country, website"
          summaryLabel="guitar brands"
          getSearchText={(brand) =>
            [
              brand.name,
              brand.slug,
              brand.country,
              brand.website,
              brand.logoUrl,
              brand.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(brand) => brand.id}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create guitar brand
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Logo URL</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(brand) => (
            <TableRow key={brand.id}>
              <TableCell className="font-medium">{brand.name}</TableCell>
              <TableCell>{brand.slug ?? "-"}</TableCell>
              <TableCell className="max-w-52 truncate">{brand.logoUrl ?? "-"}</TableCell>
              <TableCell>{brand.country ?? "-"}</TableCell>
              <TableCell className="max-w-44 truncate">{brand.website ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={brand.isActive ? "Active" : "Inactive"}
                  tone={brand.isActive ? "primary" : "muted"}
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
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              No guitar brands match the current search.
            </TableCell>
          }
        />
      </section>

      <GuitarBrandFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create guitar brand"
        description="Add a new guitar brand master data record. Only name is required."
        submitLabel="Create guitar brand"
        onSubmit={createGuitarBrand}
      />

      <GuitarBrandFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit guitar brand"
        description="Update guitar brand metadata used across the catalog."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={async (value) => {
          if (!editTarget) {
            return;
          }

          await updateGuitarBrand(editTarget.id, value);
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
        title="Delete guitar brand"
        description={`Delete ${deleteTarget?.name ?? "this guitar brand"} from master data?`}
        confirmLabel="Delete guitar brand"
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await removeGuitarBrand(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
