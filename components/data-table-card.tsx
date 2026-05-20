"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableCardProps<T> = {
  title: string;
  description: string;
  rows: T[];
  searchPlaceholder: string;
  getSearchText: (row: T) => string;
  getRowKey: (row: T) => string;
  renderHeader: () => React.ReactNode;
  renderRow: (row: T) => React.ReactNode;
  emptyMessage: React.ReactNode;
  pageSizes?: number[];
  summaryLabel: string;
  toolbar?: React.ReactNode;
};

export function DataTableCard<T>({
  title,
  description,
  rows,
  searchPlaceholder,
  getSearchText,
  getRowKey,
  renderHeader,
  renderRow,
  emptyMessage,
  pageSizes = [5, 10, 20],
  summaryLabel,
  toolbar,
}: DataTableCardProps<T>) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(pageSizes[0] ?? 5);

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => getSearchText(row).toLowerCase().includes(query));
  }, [getSearchText, rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const rangeStart = paginatedRows.length ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = (currentPage - 1) * pageSize + paginatedRows.length;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="flex w-full max-w-md items-center justify-end gap-2">
          {toolbar}
          <div className="relative w-full max-w-56">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader>{renderHeader()}</TableHeader>
          <TableBody>
            {paginatedRows.map((row) => (
              <React.Fragment key={getRowKey(row)}>{renderRow(row)}</React.Fragment>
            ))}
            {paginatedRows.length === 0 ? (
              <TableRow>{emptyMessage}</TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {rangeStart}-{rangeEnd} of {filteredRows.length} {summaryLabel}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppSelect
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
              className="h-7 px-2 text-xs"
              options={pageSizes.map((size) => ({
                value: String(size),
                label: `${size} / page`,
              }))}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Prev
            </Button>
            <div className="min-w-16 text-center text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
