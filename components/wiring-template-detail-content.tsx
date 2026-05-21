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
import { AppSelect } from "@/components/ui/app-select";
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
  hideNavbar?: boolean;
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

type TemplateAssetConnectionPoint = {
  pointKey: string;
  x: number;
  y: number;
};

type PreviewPathSegment = {
  connectionId: string;
  segmentIndex: number;
  orientation: "horizontal" | "vertical";
  start: TemplatePathPoint;
  end: TemplatePathPoint;
};

type PreviewWireBridge = {
  segmentIndex: number;
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
};

type DiagramJsonComponent = {
  id: string;
  role: string;
  assetId: string | null;
  name: string;
  componentType: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  showLabel: boolean;
};

type PreviewPanState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

type HeaderTab =
  | "Diagram"
  | "Components"
  | "Pin Connections"
  | "Switch Positions"
  | "Notes"
  | "Source";

const MIN_PREVIEW_ZOOM = 0.5;
const MAX_PREVIEW_ZOOM = 2.5;
const PREVIEW_ZOOM_STEP = 0.25;
const PREVIEW_WHEEL_ZOOM_STEP = 0.1;
const THUMBNAIL_PREVIEW_WIDTH = 1200;
const THUMBNAIL_PREVIEW_HEIGHT = 750;
const PREVIEW_WIRE_STROKE_WIDTH = 4;
const PREVIEW_WIRE_ENDPOINT_RADIUS = 4;
const PREVIEW_WIRE_BRIDGE_RADIUS = 10;
const PREVIEW_WIRE_BRIDGE_JOIN_TRIM = 0;

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

function isImageSource(value: string | null | undefined) {
  return Boolean(value && /^(https?:\/\/|\/)/.test(value));
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

function parseAssetConnectionPoints(value: string | null): TemplateAssetConnectionPoint[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<Record<string, unknown>>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((point) => {
        const pointKey =
          typeof point.pointKey === "string"
            ? point.pointKey
            : typeof point.key === "string"
              ? point.key
              : "";

        if (!pointKey || typeof point.x !== "number" || typeof point.y !== "number") {
          return null;
        }

        return {
          pointKey,
          x: point.x,
          y: point.y,
        } satisfies TemplateAssetConnectionPoint;
      })
      .filter((point): point is TemplateAssetConnectionPoint => point !== null);
  } catch {
    return [];
  }
}

function rotatePoint(x: number, y: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function buildPreviewPathSegments(
  connectionId: string,
  points: TemplatePathPoint[]
) {
  const segments: PreviewPathSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (!start || !end) {
      continue;
    }

    const deltaX = Math.abs(end.x - start.x);
    const deltaY = Math.abs(end.y - start.y);

    if (deltaX < 0.5 && deltaY < 0.5) {
      continue;
    }

    segments.push({
      connectionId,
      segmentIndex: index,
      orientation: deltaX >= deltaY ? "horizontal" : "vertical",
      start,
      end,
    });
  }

  return segments;
}

function getPreviewSegmentIntersection(
  first: PreviewPathSegment,
  second: PreviewPathSegment
) {
  if (first.orientation === second.orientation) {
    return null;
  }

  const horizontal = first.orientation === "horizontal" ? first : second;
  const vertical = first.orientation === "vertical" ? first : second;
  const horizontalMinX = Math.min(horizontal.start.x, horizontal.end.x);
  const horizontalMaxX = Math.max(horizontal.start.x, horizontal.end.x);
  const verticalMinY = Math.min(vertical.start.y, vertical.end.y);
  const verticalMaxY = Math.max(vertical.start.y, vertical.end.y);
  const x = vertical.start.x;
  const y = horizontal.start.y;
  const epsilon = 0.5;

  if (
    x <= horizontalMinX + epsilon ||
    x >= horizontalMaxX - epsilon ||
    y <= verticalMinY + epsilon ||
    y >= verticalMaxY - epsilon
  ) {
    return null;
  }

  return { x, y };
}

function computePreviewWireBridges(
  pathEntries: Array<{ connectionId: string; points: TemplatePathPoint[] }>
) {
  const bridgeMap = new Map<string, PreviewWireBridge[]>();
  const allSegments = pathEntries.flatMap((entry) =>
    buildPreviewPathSegments(entry.connectionId, entry.points)
  );

  for (const entry of pathEntries) {
    bridgeMap.set(entry.connectionId, []);
  }

  for (let index = 0; index < allSegments.length; index += 1) {
    const first = allSegments[index];

    for (let comparisonIndex = index + 1; comparisonIndex < allSegments.length; comparisonIndex += 1) {
      const second = allSegments[comparisonIndex];

      if (first.connectionId === second.connectionId) {
        continue;
      }

      const intersection = getPreviewSegmentIntersection(first, second);

      if (!intersection) {
        continue;
      }

      const bridgeSegment =
        first.orientation === "horizontal"
          ? first
          : second.orientation === "horizontal"
            ? second
            : null;

      if (!bridgeSegment) {
        continue;
      }

      const currentBridges = bridgeMap.get(bridgeSegment.connectionId) ?? [];
      const exists = currentBridges.some(
        (bridge) =>
          bridge.segmentIndex === bridgeSegment.segmentIndex &&
          Math.abs(bridge.x - intersection.x) < 0.5 &&
          Math.abs(bridge.y - intersection.y) < 0.5
      );

      if (exists) {
        continue;
      }

      currentBridges.push({
        segmentIndex: bridgeSegment.segmentIndex,
        x: intersection.x,
        y: intersection.y,
        orientation: bridgeSegment.orientation,
      });
      bridgeMap.set(bridgeSegment.connectionId, currentBridges);
    }
  }

  return bridgeMap;
}

function renderPreviewWireSegmentWithBridges(params: {
  connectionId: string;
  segmentIndex: number;
  start: TemplatePathPoint;
  end: TemplatePathPoint;
  bridges: PreviewWireBridge[];
  color: string;
  strokeWidth: number;
  opacity?: number;
  midPoint?: TemplatePathPoint;
  labelHalfWidth?: number;
  labelHalfHeight?: number;
}) {
  const { connectionId, segmentIndex, start, end, bridges, color, strokeWidth, opacity, midPoint, labelHalfWidth } = params;
  const deltaX = Math.abs(end.x - start.x);
  const deltaY = Math.abs(end.y - start.y);
  const isHorizontal = deltaX >= deltaY;
  const gapHalfWidth = Math.max(
    PREVIEW_WIRE_BRIDGE_RADIUS - strokeWidth / 2 - PREVIEW_WIRE_BRIDGE_JOIN_TRIM,
    1
  );
  const segmentBridges = bridges
    .filter((bridge) => bridge.segmentIndex === segmentIndex)
    .sort((left, right) => (isHorizontal ? left.x - right.x : left.y - right.y));

  if (segmentBridges.length === 0) {
    // If there's a label centered on the path, leave a gap equal to labelHalfWidth so the badge can sit
    if (midPoint && labelHalfWidth && isHorizontal) {
      const gapStart = midPoint.x - labelHalfWidth - 2; // small padding
      const gapEnd = midPoint.x + labelHalfWidth + 2;

      // If the gap doesn't intersect this segment, draw full line
      if (gapEnd < Math.min(start.x, end.x) || gapStart > Math.max(start.x, end.x)) {
        return (
          <line
            key={`${connectionId}-${segmentIndex}-full-${strokeWidth}-${opacity ?? 1}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      const parts: React.ReactNode[] = [];
      const left = Math.min(start.x, end.x);
      const right = Math.max(start.x, end.x);
      const segY = start.y;

      if (gapStart > left) {
        parts.push(
          <line
            key={`${connectionId}-${segmentIndex}-a-${strokeWidth}-${opacity ?? 1}`}
            x1={start.x}
            y1={segY}
            x2={gapStart}
            y2={segY}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      if (gapEnd < right) {
        parts.push(
          <line
            key={`${connectionId}-${segmentIndex}-b-${strokeWidth}-${opacity ?? 1}`}
            x1={gapEnd}
            y1={segY}
            x2={end.x}
            y2={segY}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      return parts;
    }

    if (midPoint && labelHalfWidth && !isHorizontal) {
      const gapStart = midPoint.y - (params.labelHalfHeight ?? 0) - 2;
      const gapEnd = midPoint.y + (params.labelHalfHeight ?? 0) + 2;

      if (gapEnd < Math.min(start.y, end.y) || gapStart > Math.max(start.y, end.y)) {
        return (
          <line
            key={`${connectionId}-${segmentIndex}-full-${strokeWidth}-${opacity ?? 1}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      const parts: React.ReactNode[] = [];
      const top = Math.min(start.y, end.y);
      const bottom = Math.max(start.y, end.y);
      const segX = start.x;

      if (gapStart > top) {
        parts.push(
          <line
            key={`${connectionId}-${segmentIndex}-a-${strokeWidth}-${opacity ?? 1}`}
            x1={segX}
            y1={start.y}
            x2={segX}
            y2={gapStart}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      if (gapEnd < bottom) {
        parts.push(
          <line
            key={`${connectionId}-${segmentIndex}-b-${strokeWidth}-${opacity ?? 1}`}
            x1={segX}
            y1={gapEnd}
            x2={segX}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      return parts;
    }

    return (
      <line
        key={`${connectionId}-${segmentIndex}-full-${strokeWidth}-${opacity ?? 1}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    );
  }

  const parts: React.ReactNode[] = [];

  if (isHorizontal) {
    const direction = end.x >= start.x ? 1 : -1;
    let currentX = start.x;

    for (const bridge of segmentBridges) {
      const bridgeStartX = bridge.x - gapHalfWidth * direction;
      const bridgeEndX = bridge.x + gapHalfWidth * direction;

      parts.push(
        <line
          key={`${connectionId}-${segmentIndex}-${bridge.x}-${strokeWidth}-a`}
          x1={currentX}
          y1={start.y}
          x2={bridgeStartX}
          y2={start.y}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
      );

      currentX = bridgeEndX;
    }

    parts.push(
      <line
        key={`${connectionId}-${segmentIndex}-tail-${strokeWidth}-${opacity ?? 1}`}
        x1={currentX}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    );

    return parts;
  }

  const direction = end.y >= start.y ? 1 : -1;
  let currentY = start.y;

  for (const bridge of segmentBridges) {
    const bridgeStartY = bridge.y - gapHalfWidth * direction;
    const bridgeEndY = bridge.y + gapHalfWidth * direction;

    parts.push(
      <line
        key={`${connectionId}-${segmentIndex}-${bridge.y}-${strokeWidth}-a`}
        x1={start.x}
        y1={currentY}
        x2={start.x}
        y2={bridgeStartY}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    );

    currentY = bridgeEndY;
  }

  parts.push(
    <line
      key={`${connectionId}-${segmentIndex}-tail-${strokeWidth}-${opacity ?? 1}`}
      x1={start.x}
      y1={currentY}
      x2={end.x}
      y2={end.y}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );

  return parts;
}

function renderPreviewWireBridgeArc(params: {
  connectionId: string;
  bridge: PreviewWireBridge;
  color: string;
  strokeWidth: number;
}) {
  const { connectionId, bridge, color, strokeWidth } = params;
  const arcPath =
    bridge.orientation === "horizontal"
      ? `M ${bridge.x - PREVIEW_WIRE_BRIDGE_RADIUS} ${bridge.y} A ${PREVIEW_WIRE_BRIDGE_RADIUS} ${PREVIEW_WIRE_BRIDGE_RADIUS} 0 0 1 ${bridge.x + PREVIEW_WIRE_BRIDGE_RADIUS} ${bridge.y}`
      : `M ${bridge.x} ${bridge.y - PREVIEW_WIRE_BRIDGE_RADIUS} A ${PREVIEW_WIRE_BRIDGE_RADIUS} ${PREVIEW_WIRE_BRIDGE_RADIUS} 0 0 1 ${bridge.x} ${bridge.y + PREVIEW_WIRE_BRIDGE_RADIUS}`;

  return (
    <path
      key={`${connectionId}-bridge-${bridge.segmentIndex}-${bridge.x}-${bridge.y}`}
      d={arcPath}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function computePathMidPoint(pathPoints: TemplatePathPoint[]): TemplatePathPoint {
  if (!pathPoints || pathPoints.length === 0) {
    return { x: 0, y: 0 };
  }

  if (pathPoints.length === 1) {
    return pathPoints[0];
  }

  const lengths: number[] = [];
  let total = 0;

  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    lengths.push(len);
    total += len;
  }

  if (total === 0) {
    return pathPoints[Math.floor(pathPoints.length / 2)] ?? pathPoints[0];
  }

  const target = total / 2;
  let accum = 0;

  for (let i = 0; i < lengths.length; i += 1) {
    const segLen = lengths[i];
    if (accum + segLen >= target) {
      const remain = target - accum;
      const t = segLen === 0 ? 0 : remain / segLen;
      const start = pathPoints[i];
      const end = pathPoints[i + 1];
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      };
    }

    accum += segLen;
  }

  return pathPoints[Math.floor(pathPoints.length / 2)] ?? pathPoints[0];
}

function parseDiagramJsonComponents(value: string): DiagramJsonComponent[] {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (!Array.isArray(parsed.components)) {
      return [];
    }

    return parsed.components
      .map((component) => {
        if (!component || typeof component !== "object") {
          return null;
        }

        const item = component as Record<string, unknown>;

        if (
          typeof item.id !== "string" ||
          typeof item.role !== "string" ||
          typeof item.name !== "string" ||
          typeof item.componentType !== "string" ||
          typeof item.x !== "number" ||
          typeof item.y !== "number" ||
          typeof item.rotation !== "number" ||
          typeof item.scale !== "number" ||
          typeof item.showLabel !== "boolean"
        ) {
          return null;
        }

        return {
          id: item.id,
          role: item.role,
          assetId: typeof item.assetId === "string" ? item.assetId : null,
          name: item.name,
          componentType: item.componentType,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
          scale: item.scale,
          showLabel: item.showLabel,
        } satisfies DiagramJsonComponent;
      })
      .filter((component): component is DiagramJsonComponent => component !== null);
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

/**
 * Parse a CSS color string to RGB components (0–255).
 * Supports: #rgb, #rrggbb, named "black"/"white", and rgb(...).
 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim().toLowerCase();

  if (trimmed === "black") return { r: 0, g: 0, b: 0 };
  if (trimmed === "white") return { r: 255, g: 255, b: 255 };

  const hex6 = /^#([0-9a-f]{6})$/.exec(trimmed);
  if (hex6) {
    const v = parseInt(hex6[1], 16);
    return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
  }

  const hex3 = /^#([0-9a-f]{3})$/.exec(trimmed);
  if (hex3) {
    const r = parseInt(hex3[1][0] + hex3[1][0], 16);
    const g = parseInt(hex3[1][1] + hex3[1][1], 16);
    const b = parseInt(hex3[1][2] + hex3[1][2], 16);
    return { r, g, b };
  }

  const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(trimmed);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }

  return null;
}

/**
 * Returns the relative luminance (0–1) of a color.
 */
function getColorLuminance(color: string): number {
  const rgb = parseColorToRgb(color);
  if (!rgb) return 0.5;

  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/**
 * Returns true if the color is too dark to be visible on a dark background.
 * Threshold luminance < 0.08 covers black, very dark grays, dark navy, etc.
 */
function isColorInvisibleOnDark(color: string): boolean {
  return getColorLuminance(color) < 0.08;
}

/**
 * Returns the effective display color for a wire, accounting for dark mode.
 * On dark backgrounds, very dark colors are replaced with white so they remain visible.
 */
function resolveWireDisplayColor(rawColor: string, isDark: boolean): string {
  if (isDark && isColorInvisibleOnDark(rawColor)) {
    return "#ffffff";
  }
  return rawColor;
}

function getConnectionCategory(connection: WiringTemplateDetail["connections"][number]) {
  const typeName = connection.wireTypeName.trim().toLowerCase();
  const colorName = connection.wireColor?.trim().toLowerCase() ?? "";

  if (
    typeName.includes("ground") ||
    colorName.includes("black") ||
    colorName.includes("ground")
  ) {
    return { label: "Ground Connections", tone: "Ground", color: "#000000" };
  }

  if (
    typeName.includes("vcc") ||
    typeName.includes("power") ||
    colorName.includes("red")
  ) {
    return { label: "Power Connections", tone: "VCC", color: "#ef4444" };
  }

  if (
    typeName.includes("signal") ||
    colorName.includes("green")
  ) {
    return { label: "Signal Connections", tone: "Signal", color: "#22c55e" };
  }

  if (typeName.includes("data") || colorName.includes("blue")) {
    return { label: "Data Connections", tone: "Data", color: "#3b82f6" };
  }

  if (typeName.includes("pwm") || colorName.includes("purple")) {
    return { label: "PWM Connections", tone: "PWM", color: "#8b5cf6" };
  }

  return { label: "Other Connections", tone: "Other", color: "#f59e0b" };
}

export function WiringTemplateDetailContent({
  template: initialTemplate,
  editHref = "/custom-builder",
  showEditButton = true,
  backHref = "/explore",
  backLabel = "Back to Explore",
  hideNavbar = false,
}: WiringTemplateDetailContentProps) {
  const router = useRouter();
  const [template, setTemplate] = React.useState(initialTemplate);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [pinFilterTone, setPinFilterTone] = React.useState<string | null>(null);
  const [pinFilterComponent, setPinFilterComponent] = React.useState<string | null>(null);
  const [isLovePending, setIsLovePending] = React.useState(false);
  const [isLoveAnimating, setIsLoveAnimating] = React.useState(false);
  const [isSavePending, setIsSavePending] = React.useState(false);
  const [isSaveAnimating, setIsSaveAnimating] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(1);
  const [isPreviewPanning, setIsPreviewPanning] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<HeaderTab>("Diagram");
  const previewViewportRef = React.useRef<HTMLDivElement | null>(null);
  const previewPanStateRef = React.useRef<PreviewPanState | null>(null);
  const inventory = parseWiringTemplateInventory(
    template.diagramJson,
    template.switchLogicJson
  );
  const fallbackDiagramComponents = React.useMemo(
    () => parseDiagramJsonComponents(template.diagramJson),
    [template.diagramJson]
  );
  const previewZoomPercentage = `${Math.round(previewZoom * 100)}%`;

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
        assetConnectionPoints: parseAssetConnectionPoints(component.assetAnchorPointsJson),
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

        const getPreviewPoint = (
          component: (typeof componentBoxes)[number],
          pointKey: string
        ) => {
          const assetPoint = component.assetConnectionPoints.find(
            (point) => point.pointKey === pointKey
          );

          if (!assetPoint || !component.assetWidth || !component.assetHeight) {
            return {
              x: component.centerX,
              y: component.centerY,
            };
          }

          const rotatedPoint = rotatePoint(
            assetPoint.x * (component.width / Math.max(component.assetWidth, 1)),
            assetPoint.y * (component.height / Math.max(component.assetHeight, 1)),
            component.rotation
          );

          return {
            x: component.positionX + rotatedPoint.x,
            y: component.positionY + rotatedPoint.y,
          };
        };

        const fromPoint = getPreviewPoint(fromComponent, connection.fromPointKey);
        const toPoint = getPreviewPoint(toComponent, connection.toPointKey);

        const pathPoints = [
          fromPoint,
          ...parseConnectionControlPoints(connection.pathJson),
          toPoint,
        ];

        points.push(...pathPoints);

          // estimate label size in viewBox units (approximate character width)
          const LABEL_FONT_SIZE = 14;
          const CHAR_WIDTH_ESTIMATE = 7; // approx px per char
          const H_PADDING = 10;
          const V_PADDING = 6;
          const labelText = connection.label ?? "";
          const labelWidthEstimate = labelText.length > 0 ? labelText.length * CHAR_WIDTH_ESTIMATE + H_PADDING * 2 : 0;
          const labelHalfWidth = labelWidthEstimate / 2;
          const labelHalfHeight = labelText.length > 0 ? LABEL_FONT_SIZE / 2 + V_PADDING : 0;

          return {
            id: connection.id,
            pathPoints,
            path: pathPoints.map((point) => `${point.x},${point.y}`).join(" "),
            wireColor: connection.wireColor,
            label: connection.label,
            from: pathPoints[0],
            to: pathPoints[pathPoints.length - 1],
            midPoint: computePathMidPoint(pathPoints),
            labelHalfWidth,
            labelHalfHeight,
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
    const wireBridges = computePreviewWireBridges(
      connections.map((connection) => ({
        connectionId: connection.id,
        points: connection.pathPoints,
      }))
    );

    return {
      componentBoxes,
      connections,
      wireBridges,
      viewBox: {
        x: viewBoxX,
        y: viewBoxY,
        width: viewBoxWidth,
        height: viewBoxHeight,
        value: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      },
    };
  })();

  const headerTabs: HeaderTab[] = [
    "Diagram",
    "Components",
    "Pin Connections",
    "Switch Positions",
    "Notes",
    "Source",
  ];
  const componentByRole = new Map(
    template.components.map((component) => [component.componentRole, component] as const)
  );

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
    const viewport = previewViewportRef.current;

    if (!viewport) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const direction = event.deltaY > 0 ? -1 : 1;
      const nextZoom = Number((previewZoom + direction * PREVIEW_WHEEL_ZOOM_STEP).toFixed(2));

      applyPreviewZoom(nextZoom, { clientX: event.clientX, clientY: event.clientY });
      return;
    }

    if (event.shiftKey && Math.abs(event.deltaX) < 0.5) {
      viewport.scrollLeft += event.deltaY;
      return;
    }

    viewport.scrollLeft += event.deltaX;
    viewport.scrollTop += event.deltaY;
  }

  return (
    <div className="flex flex-1 flex-col">
      {!hideNavbar && (
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
      )}

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
                  <div className="mt-3 min-w-0">
                    <Link
                      href={
                        template.creatorId
                          ? `/explore/creator/${template.creatorId}`
                          : "#"
                      }
                      className={cn(
                        "flex min-w-0 items-center gap-3",
                        template.creatorId
                          ? "transition hover:text-primary"
                          : "pointer-events-none"
                      )}
                      aria-disabled={template.creatorId ? undefined : true}
                      tabIndex={template.creatorId ? undefined : -1}
                    >
                      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-foreground">
                        {isImageSource(template.creatorPhoto) ? (
                          <Image
                            src={template.creatorPhoto!}
                            alt={template.creatorName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          getCreatorInitials(template.creatorName)
                        )}
                      </div>
                      <div className="min-w-0 truncate text-sm font-medium text-foreground">
                        {template.creatorName}
                      </div>
                    </Link>
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

              <div className="flex flex-wrap items-center gap-1">
                {headerTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                    {activeTab === tab ? (
                      <span className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomPreviewOut}
                    disabled={activeTab !== "Diagram" || previewZoom <= MIN_PREVIEW_ZOOM}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPreviewZoom}
                    disabled={activeTab !== "Diagram"}
                  >
                    {previewZoomPercentage}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomPreviewIn}
                    disabled={activeTab !== "Diagram" || previewZoom >= MAX_PREVIEW_ZOOM}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {activeTab === "Diagram" ? (
                <div className="relative overflow-hidden bg-white">
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
                    className={`relative h-[70vh] min-h-[560px] max-h-[78vh] overflow-auto ${isPreviewPanning ? "cursor-grabbing" : "cursor-grab"}`}
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
                            {connection.pathPoints
                              .slice(0, -1)
                              .map((start, segmentIndex) => {
                                const end = connection.pathPoints[segmentIndex + 1];

                                if (!start || !end) {
                                  return null;
                                }

                                return (
                                  <React.Fragment key={`${connection.id}-${segmentIndex}`}>
                                    {renderPreviewWireSegmentWithBridges({
                                      connectionId: connection.id,
                                      segmentIndex,
                                      start,
                                      end,
                                      bridges:
                                        previewData.wireBridges.get(connection.id) ?? [],
                                      color: connection.wireColor || "#0f766e",
                                      strokeWidth: PREVIEW_WIRE_STROKE_WIDTH,
                                      midPoint: connection.midPoint,
                                      labelHalfWidth: connection.labelHalfWidth,
                                      labelHalfHeight: connection.labelHalfHeight,
                                    })}
                                  </React.Fragment>
                                );
                              })}
                            {(previewData.wireBridges.get(connection.id) ?? []).map((bridge) =>
                              renderPreviewWireBridgeArc({
                                connectionId: connection.id,
                                bridge,
                                color: connection.wireColor || "#0f766e",
                                strokeWidth: PREVIEW_WIRE_STROKE_WIDTH,
                              })
                            )}
                            <circle
                              cx={connection.from.x}
                              cy={connection.from.y}
                              r={PREVIEW_WIRE_ENDPOINT_RADIUS}
                              fill={connection.wireColor || "#0f766e"}
                            />
                            <circle
                              cx={connection.to.x}
                              cy={connection.to.y}
                              r={PREVIEW_WIRE_ENDPOINT_RADIUS}
                              fill={connection.wireColor || "#0f766e"}
                            />
                            {connection.label ? (
                              <g>
                                <rect
                                  x={connection.midPoint.x - (connection.labelHalfWidth ?? 0)}
                                  y={connection.midPoint.y - (connection.labelHalfHeight ?? 0)}
                                  width={(connection.labelHalfWidth ?? 0) * 2}
                                  height={(connection.labelHalfHeight ?? 0) * 2}
                                  rx={10}
                                  fill={"rgba(255,255,255,0.95)"}
                                  stroke={connection.wireColor || "#e5e7eb"}
                                  strokeWidth={1}
                                />
                                <text
                                  x={connection.midPoint.x}
                                  y={connection.midPoint.y + 5}
                                  fontSize="14"
                                  fill="#475569"
                                  textAnchor="middle"
                                  alignmentBaseline="middle"
                                >
                                  {connection.label}
                                </text>
                              </g>
                            ) : null}
                          </g>
                        ))}

                        {previewData.componentBoxes.map((component) => (
                          <g key={component.id}>
                            <g
                              transform={`rotate(${component.rotation} ${component.centerX} ${component.centerY})`}
                            >
                              {isImageSource(component.assetPreviewUrl) ? (
                                <image
                                  href={component.assetPreviewUrl ?? undefined}
                                  x={component.positionX}
                                  y={component.positionY}
                                  width={component.width}
                                  height={component.height}
                                  preserveAspectRatio="none"
                                />
                              ) : (
                                <>
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
                                </>
                              )}
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
                      <div className="overflow-hidden bg-white">
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
                      <div className="flex min-h-[560px] items-center justify-center bg-white px-6 text-center text-sm text-muted-foreground">
                        Belum ada posisi komponen yang bisa divisualisasikan.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "Components" ? (
                template.components.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {template.components.map((component) => (
                      <div
                        key={component.id}
                        className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-white">
                            {isImageSource(component.assetPreviewUrl) ? (
                              <Image
                                src={component.assetPreviewUrl!}
                                alt={component.assetName}
                                fill
                                unoptimized
                                className="object-contain"
                              />
                            ) : (
                              <div className="px-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                No Preview
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-semibold text-foreground">
                              {component.componentRole}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {component.detailSubtitle ?? component.componentType}
                            </div>
                            {component.assetAuthorName ? (
                              <div className="mt-2 flex items-center gap-1.5">
                                {component.assetAuthorPhoto ? (
                                  <Image
                                    src={component.assetAuthorPhoto}
                                    alt={component.assetAuthorName}
                                    width={16}
                                    height={16}
                                    className="size-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold uppercase text-muted-foreground">
                                    {component.assetAuthorName[0]}
                                  </span>
                                )}
                                <span className="truncate text-xs text-muted-foreground">
                                  <span className="opacity-60">by </span>
                                  {component.assetAuthorName}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm font-medium text-foreground">
                            {component.detailTitle}
                          </div>
                          {component.detailDescription ? (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {component.detailDescription}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <InfoRow label="Asset" value={component.assetName} />
                          {component.detailSpecs.length > 0
                            ? component.detailSpecs.map((spec) => (
                                <InfoRow
                                  key={`${component.id}-${spec.label}`}
                                  label={spec.label}
                                  value={spec.value}
                                />
                              ))
                            : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fallbackDiagramComponents.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {fallbackDiagramComponents.map((component) => (
                      <div
                        key={component.id}
                        className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                      >
                        <div className="text-base font-semibold text-foreground">
                          {component.role}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {component.componentType}
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <InfoRow label="Asset" value={component.name} />
                          <InfoRow
                            label="Detail"
                            value="Belum tersedia untuk template lama ini."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 text-center text-sm text-muted-foreground">
                    Tidak ada komponen tersimpan pada template ini.
                  </div>
                )
              ) : null}

              {activeTab === "Pin Connections" ? (
                template.connections.length > 0 ? (() => {
                  // Build per-connection metadata once
                  const connectionsMeta = template.connections.map((connection) => {
                    const fromComponent = componentByRole.get(connection.fromComponentRole) ?? null;
                    const toComponent = componentByRole.get(connection.toComponentRole) ?? null;
                    const category = getConnectionCategory(connection);
                    const connectionColor = connection.wireColor || category.color;
                    const displayColor = resolveWireDisplayColor(connectionColor, isDarkMode);
                    return { connection, fromComponent, toComponent, category, connectionColor, displayColor };
                  });

                  // Unique tones actually present, preserving order of first appearance
                  const activeTones = Array.from(
                    new Map(
                      connectionsMeta.map(({ category, displayColor }) => [
                        category.tone,
                        { tone: category.tone, color: displayColor },
                      ])
                    ).values()
                  );

                  // Unique component roles present (from or to), with display label
                  const componentOptions = Array.from(
                    new Map(
                      connectionsMeta.flatMap(({ connection, fromComponent, toComponent }) => [
                        [
                          connection.fromComponentRole,
                          {
                            role: connection.fromComponentRole,
                            label: fromComponent?.detailTitle ?? connection.fromComponentRole,
                          },
                        ],
                        [
                          connection.toComponentRole,
                          {
                            role: connection.toComponentRole,
                            label: toComponent?.detailTitle ?? connection.toComponentRole,
                          },
                        ],
                      ])
                    ).values()
                  );

                  // Apply filters
                  const filtered = connectionsMeta.filter(({ category, connection }) => {
                    if (pinFilterTone !== null && category.tone !== pinFilterTone) return false;
                    if (
                      pinFilterComponent !== null &&
                      connection.fromComponentRole !== pinFilterComponent &&
                      connection.toComponentRole !== pinFilterComponent
                    ) {
                      return false;
                    }
                    return true;
                  });

                  return (
                    <div className="grid gap-4">
                      {/* Legend + filters bar */}
                      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                        {/* Tone filter pills — grows and wraps */}
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          {activeTones.map((item) => {
                            const isActive = pinFilterTone === item.tone;
                            return (
                              <button
                                key={item.tone}
                                type="button"
                                onClick={() => setPinFilterTone(isActive ? null : item.tone)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                  isActive
                                    ? "border-transparent text-white"
                                    : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                                )}
                                style={isActive ? { backgroundColor: item.color, borderColor: item.color } : {}}
                              >
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.tone}
                              </button>
                            );
                          })}
                        </div>

                        {/* Right side: divider + component select + clear — never wraps */}
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="h-4 w-px bg-border/60" />
                          <AppSelect
                            value={pinFilterComponent ?? ""}
                            onValueChange={(val) => setPinFilterComponent(val || null)}
                            placeholder="All components"
                            emptyLabel="All components"
                            options={componentOptions.map((opt) => ({
                              value: opt.role,
                              label: opt.label,
                            }))}
                          />
                          {(pinFilterTone !== null || pinFilterComponent !== null) && (
                            <button
                              type="button"
                              onClick={() => { setPinFilterTone(null); setPinFilterComponent(null); }}
                              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connection list */}
                      <div className="grid gap-3">
                        {filtered.length === 0 ? (
                          <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 text-sm text-muted-foreground">
                            Tidak ada koneksi yang cocok dengan filter.
                          </div>
                        ) : (
                          filtered.map(({ connection, fromComponent, toComponent, displayColor }) => (
                            <div
                              key={connection.id}
                              className="rounded-2xl border border-border/70 bg-background/70 p-4"
                            >
                              <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_minmax(120px,1fr)_minmax(0,240px)] lg:items-center">
                                <div className="min-w-0 rounded-xl border border-border/70 bg-background p-3">
                                  <div className="truncate text-sm font-semibold text-foreground">
                                    {fromComponent?.detailTitle ?? connection.fromComponentRole}
                                  </div>
                                  <div className="mt-1 truncate text-xs text-muted-foreground">
                                    {connection.fromComponentRole}
                                  </div>
                                  <div
                                    className="mt-3 inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                      backgroundColor: displayColor,
                                      color: displayColor === "#ffffff" ? "#000000" : "#ffffff",
                                    }}
                                  >
                                    {connection.fromPointKey}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className="size-3 shrink-0 rounded-full border-2 border-background shadow-sm"
                                    style={{ backgroundColor: displayColor }}
                                  />
                                  <div className="relative min-w-[120px] flex-1">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-0.5 flex-1"
                                        style={{ backgroundColor: displayColor }}
                                      />
                                      <div
                                        className="rounded-md border px-2.5 py-1 text-[11px] font-medium"
                                        style={{
                                          borderColor: displayColor,
                                          backgroundColor: `${displayColor}18`,
                                          color: displayColor,
                                        }}
                                      >
                                        {connection.wireTypeName}
                                      </div>
                                      <div
                                        className="h-0.5 flex-1"
                                        style={{ backgroundColor: displayColor }}
                                      />
                                    </div>
                                  </div>
                                  <div
                                    className="size-0 border-y-[6px] border-l-[10px] border-y-transparent"
                                    style={{ borderLeftColor: displayColor }}
                                  />
                                </div>

                                <div className="min-w-0 rounded-xl border border-border/70 bg-background p-3 text-right">
                                  <div className="truncate text-sm font-semibold text-foreground">
                                    {toComponent?.detailTitle ?? connection.toComponentRole}
                                  </div>
                                  <div className="mt-1 truncate text-xs text-muted-foreground">
                                    {connection.toComponentRole}
                                  </div>
                                  <div
                                    className="mt-3 inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                      backgroundColor: displayColor,
                                      color: displayColor === "#ffffff" ? "#000000" : "#ffffff",
                                    }}
                                  >
                                    {connection.toPointKey}
                                  </div>
                                </div>
                              </div>

                              {connection.notes ? (
                                <div className="mt-3 text-sm text-muted-foreground">
                                  {connection.notes}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 text-center text-sm text-muted-foreground">
                    Tidak ada koneksi pin tersimpan pada template ini.
                  </div>
                )
              ) : null}

              {activeTab !== "Diagram" &&
              activeTab !== "Components" &&
              activeTab !== "Pin Connections" ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 text-center text-sm text-muted-foreground">
                  Tab {activeTab} belum diaktifkan di halaman detail ini.
                </div>
              ) : null}

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
