"use client";

import * as React from "react";
import Image from "next/image";
import {
  ElectricPlugsIcon,
  PaintBrush02Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons";

import { AssetEditorButton } from "@/components/asset-editor-button";
import { DataTableCard } from "@/components/data-table-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { type OutputJackRow } from "@/lib/output-jack-types";

type OutputJackManagementContentProps = {
  initialOutputJacks: OutputJackRow[];
};

export function OutputJackManagementContent({
  initialOutputJacks,
}: OutputJackManagementContentProps) {
  const [outputJacks] = React.useState<OutputJackRow[]>(initialOutputJacks);

  const stats = [
    {
      title: "Total output jacks",
      value: String(outputJacks.length),
      change: `${outputJacks.filter((item) => item.isActive).length} active`,
      detail: "published jack masters available",
      icon: ElectricPlugsIcon,
    },
    {
      title: "Mono entries",
      value: String(
        outputJacks.filter(
          (item) => item.jackType?.trim().toLowerCase() === "mono"
        ).length
      ),
      change: "standard guitar output options",
      detail: "most common passive wiring target",
      icon: PaintBrush02Icon,
    },
    {
      title: "Three-conductor+",
      value: String(
        outputJacks.filter((item) => (item.conductorCount ?? 0) >= 3).length
      ),
      change: "stereo, TRS, or switching-ready",
      detail: "useful for active or split-routing builds",
      icon: ToggleOnIcon,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section>
        <DataTableCard
          title="Master output jacks"
          description="Review published output jack masters, preview assets, and reopen them in the component editor."
          rows={outputJacks}
          searchPlaceholder="Search output jack, slug, mount, conductor..."
          summaryLabel="output jacks"
          getSearchText={(item) =>
            [
              item.name,
              item.slug,
              item.jackType,
              item.mountingStyle,
              item.description,
              item.conductorCount ? String(item.conductorCount) : null,
              item.isActive ? "active" : "inactive",
            ]
              .filter(Boolean)
              .join(" ")
          }
          getRowKey={(item) => item.id}
          renderHeader={() => (
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Jack Type</TableHead>
              <TableHead>Mounting</TableHead>
              <TableHead>Conductors</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-white">
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
              <TableCell>{item.jackType ?? "-"}</TableCell>
              <TableCell>{item.mountingStyle ?? "-"}</TableCell>
              <TableCell>{item.conductorCount ?? "-"}</TableCell>
              <TableCell className="max-w-72 truncate">{item.description ?? "-"}</TableCell>
              <TableCell>
                <StatusPill
                  label={item.isActive ? "Active" : "Inactive"}
                  tone={item.isActive ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <AssetEditorButton ownerType="output-jack" ownerId={item.id} />
              </TableCell>
            </TableRow>
          )}
          emptyMessage={
            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
              No output jacks match the current search.
            </TableCell>
          }
        />
      </section>
    </div>
  );
}
