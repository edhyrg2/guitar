import type {
  CanvasObject,
  ConnectionPoint,
  DrawObject,
  EditorDocument,
  EditorTool,
  EllipseObject,
  ImageObject,
  LineObject,
  RectangleObject,
  TextObject,
} from "@/lib/custom-component-editor-types";

const MIN_SHAPE_SIZE = 10;
const DEFAULT_CANVAS_FONT_FAMILY = "Inter, Arial, sans-serif";

export function createEditorId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createBaseObject(
  type: CanvasObject["type"],
  x: number,
  y: number
): Omit<
  CanvasObject,
  | "type"
  | "width"
  | "height"
  | "points"
  | "text"
  | "fontSize"
  | "fontFamily"
  | "fontStyle"
  | "textAlign"
  | "src"
  | "cornerRadius"
> {
  return {
    id: createEditorId(type),
    name: getDefaultObjectName(type),
    x,
    y,
    rotation: 0,
    opacity: 1,
    fill: "#f59e0b",
    stroke: "#111827",
    strokeWidth: 2,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
  };
}

export function getDefaultObjectName(type: CanvasObject["type"]) {
  switch (type) {
    case "rectangle":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "line":
      return "Line";
    case "text":
      return "Text";
    case "image":
      return "Image";
    case "draw":
      return "Free Draw";
  }
}

export function createConnectionPoint(params: {
  x: number;
  y: number;
  index?: number;
}): ConnectionPoint {
  const sequence = (params.index ?? 0) + 1;

  return {
    id: createEditorId("connection-point"),
    key: `point-${sequence}`,
    label: `Point ${sequence}`,
    pointType: "Lug",
    color: "#0f766e",
    x: params.x,
    y: params.y,
    description: null,
  };
}

export function isShapeTool(tool: EditorTool) {
  return (
    tool === "rectangle" ||
    tool === "ellipse" ||
    tool === "line" ||
    tool === "text" ||
    tool === "draw"
  );
}

export function clampZoom(value: number) {
  return Math.min(3, Math.max(0.2, value));
}

export function normalizeBounds(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const width = Math.max(MIN_SHAPE_SIZE, Math.abs(end.x - start.x));
  const height = Math.max(MIN_SHAPE_SIZE, Math.abs(end.y - start.y));

  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width,
    height,
  };
}

export function createRectangleObject(
  start: { x: number; y: number },
  end: { x: number; y: number }
): RectangleObject {
  const bounds = normalizeBounds(start, end);

  return {
    ...createBaseObject("rectangle", bounds.x, bounds.y),
    type: "rectangle",
    width: bounds.width,
    height: bounds.height,
    cornerRadius: 18,
  };
}

export function createEllipseObject(
  start: { x: number; y: number },
  end: { x: number; y: number }
): EllipseObject {
  const bounds = normalizeBounds(start, end);

  return {
    ...createBaseObject("ellipse", bounds.x, bounds.y),
    type: "ellipse",
    width: bounds.width,
    height: bounds.height,
    fill: "#0ea5e9",
  };
}

export function createLineObject(
  start: { x: number; y: number },
  end: { x: number; y: number }
): LineObject {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  return {
    ...createBaseObject("line", start.x, start.y),
    type: "line",
    points:
      deltaX === 0 && deltaY === 0
        ? [0, 0, MIN_SHAPE_SIZE, 0]
        : [0, 0, deltaX, deltaY],
    fill: "transparent",
    stroke: "#0f766e",
  };
}

export function createTextObject(position: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}): TextObject {
  return {
    ...createBaseObject("text", position.x, position.y),
    type: "text",
    width: Math.max(MIN_SHAPE_SIZE, position.width ?? 260),
    height: Math.max(MIN_SHAPE_SIZE, position.height ?? 64),
    text: "Edit text",
    fontSize: 28,
    fontFamily: DEFAULT_CANVAS_FONT_FAMILY,
    fontStyle: "normal",
    textAlign: "left",
    fill: "#111827",
    stroke: "transparent",
    strokeWidth: 0,
  };
}

export function createImageObject(params: {
  x: number;
  y: number;
  src: string;
  width: number;
  height: number;
  name?: string;
}): ImageObject {
  return {
    ...createBaseObject("image", params.x, params.y),
    type: "image",
    name: params.name || "Uploaded Image",
    width: Math.max(MIN_SHAPE_SIZE, params.width),
    height: Math.max(MIN_SHAPE_SIZE, params.height),
    src: params.src,
    fill: "transparent",
    stroke: "#111827",
    strokeWidth: 1,
  };
}

export function createDrawObject(points: number[]): DrawObject {
  const originX = points[0] ?? 0;
  const originY = points[1] ?? 0;

  return {
    ...createBaseObject("draw", originX, originY),
    type: "draw",
    points: points.map((point, index) => (index % 2 === 0 ? point - originX : point - originY)),
    fill: "transparent",
    stroke: "#ef4444",
    strokeWidth: 3,
  };
}

export function getObjectDimensions(object: CanvasObject) {
  if (
    object.type === "rectangle" ||
    object.type === "ellipse" ||
    object.type === "text" ||
    object.type === "image"
  ) {
    return { width: object.width, height: object.height };
  }

  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let index = 0; index < object.points.length; index += 2) {
    xValues.push(object.points[index] ?? 0);
    yValues.push(object.points[index + 1] ?? 0);
  }

  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, MIN_SHAPE_SIZE);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, MIN_SHAPE_SIZE);

  return {
    width: Math.max(MIN_SHAPE_SIZE, maxX - minX),
    height: Math.max(MIN_SHAPE_SIZE, maxY - minY),
  };
}

export function getObjectBounds(object: CanvasObject) {
  if (
    object.type === "rectangle" ||
    object.type === "ellipse" ||
    object.type === "text" ||
    object.type === "image"
  ) {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let index = 0; index < object.points.length; index += 2) {
    xValues.push(object.points[index] ?? 0);
    yValues.push(object.points[index + 1] ?? 0);
  }

  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, MIN_SHAPE_SIZE);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, MIN_SHAPE_SIZE);

  return {
    x: object.x + minX,
    y: object.y + minY,
    width: Math.max(MIN_SHAPE_SIZE, maxX - minX),
    height: Math.max(MIN_SHAPE_SIZE, maxY - minY),
  };
}

export function cloneCanvasObject<T extends CanvasObject>(object: T): T {
  if (object.type === "line" || object.type === "draw") {
    return {
      ...object,
      points: [...object.points],
    };
  }

  return { ...object };
}

export function cloneCanvasObjects(objects: CanvasObject[]) {
  return objects.map((object) => cloneCanvasObject(object));
}

export function duplicateCanvasObject(object: CanvasObject) {
  const next = cloneCanvasObject(object);

  next.id = createEditorId(next.type);
  next.name = `${object.name} Copy`;
  next.groupId = undefined;
  next.x += 28;
  next.y += 28;

  return next;
}

export function serializeEditorDocument(
  objects: CanvasObject[],
  background: string,
  connectionPoints: ConnectionPoint[]
): EditorDocument {
  return {
    version: 1,
    background,
    objects: cloneCanvasObjects(objects),
    connectionPoints: connectionPoints.map((point) => ({ ...point })),
  };
}

export function normalizeEditorDocument(input: unknown): EditorDocument {
  const parsed = input as Partial<EditorDocument>;

  if (parsed.version !== 1 || !Array.isArray(parsed.objects)) {
    throw new Error("Invalid editor document.");
  }

  return {
    version: 1,
    background: typeof parsed.background === "string" ? parsed.background : "#f8fafc",
    objects: cloneCanvasObjects(parsed.objects as CanvasObject[]).map((object) => {
      if (object.type !== "text") {
        return object;
      }

      return {
        ...object,
        fontFamily:
          !object.fontFamily || object.fontFamily.startsWith("var(")
            ? DEFAULT_CANVAS_FONT_FAMILY
            : object.fontFamily,
        fontStyle: object.fontStyle ?? "normal",
        textAlign: object.textAlign ?? "left",
      };
    }),
    connectionPoints: Array.isArray(parsed.connectionPoints)
      ? (parsed.connectionPoints as ConnectionPoint[]).map((point, index) => ({
          id:
            typeof point.id === "string" && point.id.trim()
              ? point.id
              : createEditorId(`connection-point-${index}`),
          key:
            typeof point.key === "string" && point.key.trim()
              ? point.key
              : `point-${index + 1}`,
          label:
            typeof point.label === "string" && point.label.trim()
              ? point.label
              : `Point ${index + 1}`,
          pointType:
            typeof point.pointType === "string" && point.pointType.trim()
              ? point.pointType
              : "Lug",
          color:
            typeof point.color === "string" && point.color.trim()
              ? point.color
              : "#0f766e",
          x: typeof point.x === "number" ? point.x : 0,
          y: typeof point.y === "number" ? point.y : 0,
          description:
            typeof point.description === "string" && point.description.trim()
              ? point.description
              : null,
        }))
      : [],
  };
}

export function parseEditorDocument(raw: string): EditorDocument {
  return normalizeEditorDocument(JSON.parse(raw));
}
