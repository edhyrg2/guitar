export type EditorTool =
  | "select"
  | "pan"
  | "rectangle"
  | "ellipse"
  | "line"
  | "text"
  | "draw"
  | "connection-point";

export type CanvasObjectType =
  | "rectangle"
  | "ellipse"
  | "line"
  | "text"
  | "image"
  | "draw";

export type EditorViewport = {
  x: number;
  y: number;
  scale: number;
};

type CanvasObjectBase = {
  id: string;
  groupId?: string;
  type: CanvasObjectType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  locked: boolean;
};

export type RectangleObject = CanvasObjectBase & {
  type: "rectangle";
  width: number;
  height: number;
  cornerRadius: number;
};

export type EllipseObject = CanvasObjectBase & {
  type: "ellipse";
  width: number;
  height: number;
};

export type LineObject = CanvasObjectBase & {
  type: "line";
  points: number[];
};

export type DrawObject = CanvasObjectBase & {
  type: "draw";
  points: number[];
};

export type TextObject = CanvasObjectBase & {
  type: "text";
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  textAlign: "left" | "center" | "right";
};

export type ImageObject = CanvasObjectBase & {
  type: "image";
  width: number;
  height: number;
  src: string;
};

export type CanvasObject =
  | RectangleObject
  | EllipseObject
  | LineObject
  | DrawObject
  | TextObject
  | ImageObject;

export type ConnectionPoint = {
  id: string;
  key: string;
  label: string;
  pointType: string;
  color: string;
  x: number;
  y: number;
  description: string | null;
};

export type EditorDocument = {
  version: 1;
  background: string;
  objects: CanvasObject[];
  connectionPoints: ConnectionPoint[];
};
