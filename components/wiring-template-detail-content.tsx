'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Bookmark02Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  ElectricPlugsIcon,
  PaintBrush02Icon,
  Share08Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { HeartIcon } from "@/components/heart-icon";
import { TopNavbar } from "@/components/top-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseWiringTemplateInventory } from "@/lib/wiring-template-inventory";
import { cn } from "@/lib/utils";
import type { WiringTemplateDetail } from "@/lib/wiring-template-types";

type WiringTemplateDetailContentProps = {
  template: WiringTemplateDetail;
  editHref?: string;
  showEditButton?: boolean;
  backHref?: string;
  backLabel?: string;
};

type TemplateComponentMetadata = {
  width?: number;
  height?: number;
  renderWidth?: number;
  renderHeight?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
};

type TemplatePathPoint = {
  x: number;
  y: number;
};

type PreviewPanState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

const MIN_PREVIEW_ZOOM = 0.5;
const MAX_PREVIEW_ZOOM = 2.5;
const PREVIEW_ZOOM_STEP = 0.25;
const PREVIEW_WHEEL_ZOOM_STEP = 0.1;
const THUMBNAIL_PREVIEW_WIDTH = 1200;
const THUMBNAIL_PREVIEW_HEIGHT = 750;

function getCreatorInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function formatCompactMetric(value: number) {
  if (value >= 1000) {
    const compact = value / 1000;
    const formatted = compact.toFixed(1);

    return `${formatted.replace(/\.0$/, "")}k`;
  }

  return String(value);
}

function parseComponentMetadata(value: string | null): TemplateComponentMetadata {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    return {
      width: typeof parsed.width === "number" ? parsed.width : undefined,
      height: typeof parsed.height === "number" ? parsed.height : undefined,
      renderWidth: typeof parsed.renderWidth === "number" ? parsed.renderWidth : undefined,
      renderHeight: typeof parsed.renderHeight === "number" ? parsed.renderHeight : undefined,
      labelOffsetX: typeof parsed.labelOffsetX === "number" ? parsed.labelOffsetX : undefined,
      labelOffsetY: typeof parsed.labelOffsetY === "number" ? parsed.labelOffsetY : undefined,
    };
  } catch {
    return {};
  }
}

function parseConnectionControlPoints(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (!Array.isArray(parsed.controlPoints)) {
      return [];
    }

    return parsed.controlPoints
      .map((point) => {
        if (!point || typeof point !== "object") {
          return null;
        }

        const item = point as Record<string, unknown>;

        if (typeof item.x !== "number" || typeof item.y !== "number") {
          return null;
        }

        return { x: item.x, y: item.y } satisfies TemplatePathPoint;
      })
      .filter((point): point is TemplatePathPoint => point !== null);
  } catch {
    return [];
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function WiringTemplateDetailContent({
  template: initialTemplate,
  editHref = "/custom-builder",
  showEditButton = true,
  backHref = "/explore",
  backLabel = "Back to Explore",
}: WiringTemplateDetailContentProps) {
  const router = useRouter();
  const [template, setTemplate] = React.useState(initialTemplate);
  const [isLovePending, setIsLovePending] = React.useState(false);
  const [isLoveAnimating, setIsLoveAnimating] = React.useState(false);
  const [isSavePending, setIsSavePending] = React.useState(false);
  const [isSaveAnimating, setIsSaveAnimating] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(1);
  const [isPreviewPanning, setIsPreviewPanning] = React.useState(false);
  const previewViewportRef = React.useRef<HTMLDivElement | null>(null);
  const previewPanStateRef = React.useRef<PreviewPanState | null>(null);
  const inventory = parseWiringTemplateInventory(
    template.diagramJson,
    template.switchLogicJson
  );
  const previewZoomPercentage = `${Math.round(previewZoom * 100)}%`;

  const inventorySections = [
    {
      label: "Pickup",
      value:
        inventory.pickups
          .map((item) => (item.role ? `${item.role}: ${item.name}` : item.name))
          .join(", ") || "-",
    },
    {
      label: "Potentiometer",
      value:
        inventory.potentiometers
          .map((item) =>
            item.role && item.role !== "other" ? `${item.name} (${item.role})` : item.name
          )
          .join(", ") || "-",
    },
    { label: "Switch", value: inventory.switches.join(", ") || "-" },
    { label: "Capacitor", value: inventory.capacitors.join(", ") || "-" },
    { label: "Resistor", value: inventory.resistors.join(", ") || "-" },
    { label: "Output", value: inventory.outputs.join(", ") || "-" },
    { label: "Mods", value: inventory.mods.join(", ") || "-" },
  ];

  const previewData = (() => {
    if (template.components.length === 0) {
      return null;
    }

    const componentBoxes = template.components.map((component) => {
      const metadata = parseComponentMetadata(component.metadataJson);
      const baseWidth = metadata.renderWidth ?? metadata.width ?? 180;
      const baseHeight = metadata.renderHeight ?? metadata.height ?? 120;
      const width = Math.max(baseWidth * Math.max(component.scale, 0.1), 48);
      const height = Math.max(baseHeight * Math.max(component.scale, 0.1), 36);

      return {
        ...component,
        width,
        height,
        metadata,
        centerX: component.positionX + width / 2,
        centerY: component.positionY + height / 2,
      };
    });

    const points = componentBoxes.flatMap((component) => [
      { x: component.positionX, y: component.positionY },
      { x: component.positionX + component.width, y: component.positionY + component.height },
    ]);

    const connections = template.connections
      .map((connection) => {
        const fromComponent = componentBoxes.find(
          (component) => component.componentRole === connection.fromComponentRole
        );
        const toComponent = componentBoxes.find(
          (component) => component.componentRole === connection.toComponentRole
        );

        if (!fromComponent || !toComponent) {
          return null;
        }

        const pathPoints = [
          {
            x: fromComponent.centerX,
            y: fromComponent.centerY,
          },
          ...parseConnectionControlPoints(connection.pathJson),
          {
            x: toComponent.centerX,
            y: toComponent.centerY,
          },
        ];

        points.push(...pathPoints);

        return {
          id: connection.id,
          path: pathPoints.map((point) => `${point.x},${point.y}`).join(" "),
          wireColor: connection.wireColor,
          label: connection.label,
          from: pathPoints[0],
          to: pathPoints[pathPoints.length - 1],
          midPoint: pathPoints[Math.floor(pathPoints.length / 2)] ?? pathPoints[0],
        };
      })
      .filter((connection): connection is NonNullable<typeof connection> => connection !== null);

    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));
    const padding = 60;
    const viewBoxX = minX - padding;
    const viewBoxY = minY - padding;
    const viewBoxWidth = Math.max(maxX - minX + padding * 2, 320);
    const viewBoxHeight = Math.max(maxY - minY + padding * 2, 220);

    return {
      componentBoxes,
      connections,
      viewBox: {
        x: viewBoxX,
        y: viewBoxY,
        width: viewBoxWidth,
        height: viewBoxHeight,
        value: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      },
    };
  })();

  const headerTabs = ["Diagram", "Components", "Switch Positions", "Notes", "Source"];

  async function toggleTemplateLove() {
    setIsLovePending(true);
    setIsLoveAnimating(true);
    window.setTimeout(() => {
      setIsLoveAnimating(false);
    }, 220);

    try {
      const response = await fetch(`/api/wiring-templates/${template.id}/love`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
            loved?: boolean;
            loveCount?: number;
            error?: string;
          }
        | undefined;

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/explore/${template.id}`)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update love.");
      }

      setTemplate((current) => ({
        ...current,
        currentUserLoved: Boolean(payload?.loved),
        loveCount: payload?.loveCount ?? current.loveCount,
      }));
    } finally {
      setIsLovePending(false);
    }
  }

  async function toggleTemplateSave() {
    setIsSavePending(true);
    setIsSaveAnimating(true);
    window.setTimeout(() => {
      setIsSaveAnimating(false);
    }, 220);

    try {
      const response = await fetch(`/api/wiring-templates/${template.id}/save`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
            saved?: boolean;
            saveCount?: number;
            error?: string;
          }
        | undefined;

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/explore/${template.id}`)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update save.");
      }

      setTemplate((current) => ({
        ...current,
        currentUserSaved: Boolean(payload?.saved),
        saveCount: payload?.saveCount ?? current.saveCount,
      }));
    } finally {
      setIsSavePending(false);
    }
  }

  function zoomPreviewIn() {
    applyPreviewZoom(Number((previewZoom + PREVIEW_ZOOM_STEP).toFixed(2)));
  }

  function zoomPreviewOut() {
    applyPreviewZoom(Number((previewZoom - PREVIEW_ZOOM_STEP).toFixed(2)));
  }

  function resetPreviewZoom() {
    applyPreviewZoom(1);
  }

  function applyPreviewZoom(nextZoom: number, origin?: { clientX: number; clientY: number }) {
    const viewport = previewViewportRef.current;
    const clampedZoom = Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, nextZoom));

    if (!viewport) {
      setPreviewZoom(clampedZoom);
      return;
    }

    const previousZoom = previewZoom;

    if (Math.abs(clampedZoom - previousZoom) < 0.001) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const originX = origin ? origin.clientX - rect.left : rect.width / 2;
    const originY = origin ? origin.clientY - rect.top : rect.height / 2;
    const contentX = (viewport.scrollLeft + originX) / previousZoom;
    const contentY = (viewport.scrollTop + originY) / previousZoom;

    setPreviewZoom(clampedZoom);

    requestAnimationFrame(() => {
      const currentViewport = previewViewportRef.current;

      if (!currentViewport) {
        return;
      }

      currentViewport.scrollLeft = contentX * clampedZoom - originX;
      currentViewport.scrollTop = contentY * clampedZoom - originY;
    });
  }

  function handlePreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const viewport = previewViewportRef.current;

    if (!viewport) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    previewPanStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    };
    setIsPreviewPanning(true);
  }

  function handlePreviewPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const panState = previewPanStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    const viewport = previewViewportRef.current;

    if (!viewport) {
      return;
    }

    event.preventDefault();
    viewport.scrollLeft =
      panState.startScrollLeft - (event.clientX - panState.startX);
    viewport.scrollTop =
      panState.startScrollTop - (event.clientY - panState.startY);
  }

  function handlePreviewPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const panState = previewPanStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    previewPanStateRef.current = null;
    setIsPreviewPanning(false);
  }

  function handlePreviewWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Number((previewZoom + direction * PREVIEW_WHEEL_ZOOM_STEP).toFixed(2));

    applyPreviewZoom(nextZoom, { clientX: event.clientX, clientY: event.clientY });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        searchPlaceholder="Browse template detail, components, and connections..."
        items={[
          { label: "Overview", href: "/", icon: DashboardSquare01Icon },
          { label: "Explore", href: "/explore", icon: ViewIcon },
          {
            label: "Template Detail",
            href: `/explore/${template.id}`,
            icon: ElectricPlugsIcon,
            active: true,
          },
          { label: "Wiring Template", href: "/wiring/templates", icon: PaintBrush02Icon },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_280px]">
          <Card className="border border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="gap-4 border-b border-border/70 pb-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <Button variant="ghost" size="sm" className="mb-2 -ml-3 px-3" asChild>
                    <Link href={backHref}>
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      {backLabel}
                    </Link>
                  </Button>
                  <CardTitle className="text-2xl sm:text-4xl">{template.name}</CardTitle>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {getCreatorInitials(template.createdBy)}
                    </div>
                    <div className="min-w-0 truncate text-sm font-medium text-foreground">
                      {template.createdBy}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {template.sourceUrl ? (
                    <Button variant="outline" size="lg" asChild>
                      <a href={template.sourceUrl} target="_blank" rel="noreferrer">
                        <HugeiconsIcon
                          icon={Share08Icon}
                          strokeWidth={2}
                          data-icon="inline-start"
                        />
                        Share
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" disabled>
                      <HugeiconsIcon
                        icon={Share08Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Share
                    </Button>
                  )}
                  <Button
                    variant={template.currentUserSaved ? "default" : "outline"}
                    size="lg"
                    className={cn(
                      "transition-colors",
                      template.currentUserSaved
                        ? "bg-amber-500 text-white hover:bg-amber-500/90"
                        : "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                    )}
                    disabled={isSavePending}
                    onClick={() => {
                      void toggleTemplateSave();
                    }}
                  >
                    <HugeiconsIcon
                      icon={Bookmark02Icon}
                      strokeWidth={2}
                      className={cn(
                        "transition-transform duration-200 ease-out",
                        isSaveAnimating ? "scale-125" : "scale-100"
                      )}
                      data-icon="inline-start"
                    />
                    {template.currentUserSaved ? "Saved" : "Save"}{" "}
                    {formatCompactMetric(template.saveCount)}
                  </Button>
                  <Button
                    variant={template.currentUserLoved ? "default" : "outline"}
                    size="lg"
                    className={cn(
                      "transition-colors",
                      template.currentUserLoved
                        ? "bg-rose-500 text-white hover:bg-rose-500/90"
                        : "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    )}
                    disabled={isLovePending}
                    onClick={() => {
                      void toggleTemplateLove();
                    }}
                  >
                    <HeartIcon
                      filled={template.currentUserLoved || isLoveAnimating}
                      className={cn(
                        "size-4",
                        "transition-transform duration-200 ease-out",
                        isLoveAnimating ? "scale-125" : "scale-100"
                      )}
                    />
                    {formatCompactMetric(template.loveCount)}
                  </Button>
                  {showEditButton ? (
                    <Button size="lg" asChild>
                      <Link href={editHref}>
                        <HugeiconsIcon
                          icon={Edit02Icon}
                          strokeWidth={2}
                          data-icon="inline-start"
                        />
                        Edit Diagram
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {headerTabs.map((tab, index) => (
                  <Button
                    key={tab}
                    variant={index === 0 ? "secondary" : "ghost"}
                    size="sm"
                    className={index === 0 ? "shadow-sm" : ""}
                  >
                    {tab}
                  </Button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomPreviewOut}
                    disabled={previewZoom <= MIN_PREVIEW_ZOOM}
                  >
                    -
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetPreviewZoom}>
                    {previewZoomPercentage}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomPreviewIn}
                    disabled={previewZoom >= MAX_PREVIEW_ZOOM}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="relative overflow-hidden bg-background">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--color-border) 65%, transparent) 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />

                <div
                  ref={previewViewportRef}
                  className={`relative min-h-[560px] overflow-scroll ${isPreviewPanning ? "cursor-grabbing" : "cursor-grab"}`}
                  onPointerDown={handlePreviewPointerDown}
                  onPointerMove={handlePreviewPointerMove}
                  onPointerUp={handlePreviewPointerEnd}
                  onPointerCancel={handlePreviewPointerEnd}
                  onWheel={handlePreviewWheel}
                  style={{
                    touchAction: "none",
                    userSelect: "none",
                    overscrollBehavior: "contain",
                  }}
                >
                  {previewData ? (
                    <svg
                      viewBox={previewData.viewBox.value}
                      className="block"
                      width={previewData.viewBox.width * previewZoom}
                      height={previewData.viewBox.height * previewZoom}
                      style={{
                        minWidth: previewData.viewBox.width * previewZoom,
                        minHeight: previewData.viewBox.height * previewZoom,
                      }}
                    >
                      {previewData.connections.map((connection) => (
                        <g key={connection.id}>
                          <polyline
                            points={connection.path}
                            fill="none"
                            stroke={connection.wireColor || "#0f766e"}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.16"
                          />
                          <polyline
                            points={connection.path}
                            fill="none"
                            stroke={connection.wireColor || "#0f766e"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx={connection.from.x} cy={connection.from.y} r="4" fill="#0f172a" />
                          <circle cx={connection.to.x} cy={connection.to.y} r="4" fill="#0f172a" />
                          {connection.label ? (
                            <text
                              x={connection.midPoint.x + 8}
                              y={connection.midPoint.y - 8}
                              fontSize="14"
                              fill="#475569"
                            >
                              {connection.label}
                            </text>
                          ) : null}
                        </g>
                      ))}

                      {previewData.componentBoxes.map((component) => (
                        <g key={component.id}>
                          <g
                            transform={`rotate(${component.rotation} ${component.centerX} ${component.centerY})`}
                          >
                            <rect
                              x={component.positionX}
                              y={component.positionY}
                              width={component.width}
                              height={component.height}
                              rx="18"
                              fill="rgba(255,255,255,0.94)"
                              stroke="#0f766e"
                              strokeWidth="2"
                            />
                            <rect
                              x={component.positionX + 10}
                              y={component.positionY + 10}
                              width={Math.max(component.width - 20, 20)}
                              height={Math.max(component.height - 20, 16)}
                              rx="12"
                              fill="rgba(15,118,110,0.08)"
                            />
                            <text
                              x={component.positionX + 14}
                              y={component.positionY + 28}
                              fontSize="16"
                              fontWeight="700"
                              fill="#0f172a"
                            >
                              {component.componentRole}
                            </text>
                            <text
                              x={component.positionX + 14}
                              y={component.positionY + 48}
                              fontSize="13"
                              fill="#475569"
                            >
                              {component.componentType}
                            </text>
                          </g>

                          {component.showLabel ? (
                            <text
                              x={component.positionX + (component.metadata.labelOffsetX ?? 0)}
                              y={
                                component.positionY +
                                component.height +
                                22 +
                                (component.metadata.labelOffsetY ?? 0)
                              }
                              fontSize="13"
                              fill="#334155"
                            >
                              {component.assetName}
                            </text>
                          ) : null}
                        </g>
                      ))}
                    </svg>
                  ) : template.thumbnailUrl ? (
                    <div className="overflow-hidden bg-white/75">
                      <Image
                        src={template.thumbnailUrl}
                        alt={template.name}
                        width={THUMBNAIL_PREVIEW_WIDTH}
                        height={THUMBNAIL_PREVIEW_HEIGHT}
                        unoptimized
                        draggable={false}
                        className="block object-contain"
                        style={{
                          width: THUMBNAIL_PREVIEW_WIDTH * previewZoom,
                          minWidth: THUMBNAIL_PREVIEW_WIDTH * previewZoom,
                          height: THUMBNAIL_PREVIEW_HEIGHT * previewZoom,
                          minHeight: THUMBNAIL_PREVIEW_HEIGHT * previewZoom,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[560px] items-center justify-center bg-muted/10 px-6 text-center text-sm text-muted-foreground">
                      Belum ada posisi komponen yang bisa divisualisasikan.
                    </div>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Detected Inventory</CardTitle>
                <CardDescription>
                  Ringkasan komponen yang dibaca dari payload publish.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {inventorySections.map((section) => (
                  <InfoRow key={section.label} label={section.label} value={section.value} />
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Diagram Info</CardTitle>
                <CardDescription>
                  Metadata tambahan untuk validasi dan referensi.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <InfoRow label="Status" value={template.isVerified ? "Verified" : "Published"} />
                <InfoRow label="Source Type" value={template.sourceType ?? "-"} />
                <InfoRow label="Source URL" value={template.sourceUrl ? "Available" : "-"} />
                <InfoRow label="Components" value={String(template.components.length)} />
                <InfoRow label="Connections" value={String(template.connections.length)} />
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Switch Logic JSON</CardTitle>
                <CardDescription>
                  Payload logic yang tersimpan untuk template ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs text-foreground">
                  {template.switchLogicJson}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}
