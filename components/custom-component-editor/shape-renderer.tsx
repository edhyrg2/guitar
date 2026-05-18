"use client";

import * as React from "react";
import type Konva from "konva";
import {
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Shape,
  Text,
} from "react-konva";

import type { CanvasObject, ImageObject } from "@/lib/custom-component-editor-types";
import { getObjectDimensions } from "@/lib/custom-component-editor-utils";

function useLoadedImage(source: string) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);
    nextImage.src = source;

    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [source]);

  return image;
}

function ImageNode({ object }: { object: ImageObject }) {
  const image = useLoadedImage(object.src);

  if (!image) {
    return (
      <Rect
        width={object.width}
        height={object.height}
        fill="#e2e8f0"
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        cornerRadius={18}
      />
    );
  }

  return (
    <KonvaImage
      image={image}
      width={object.width}
      height={object.height}
      opacity={object.opacity}
    />
  );
}

type ShapeRendererProps = {
  object: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string, additive?: boolean) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: (id: string, node: Konva.Group) => void;
  onDragMove: (id: string, node: Konva.Group, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Group) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
};

export function ShapeRenderer({
  object,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  registerNode,
}: ShapeRendererProps) {
  const dimensions = getObjectDimensions(object);
  const resolvedTextFontFamily =
    object.type === "text" &&
    (!object.fontFamily || object.fontFamily.startsWith("var("))
      ? "Inter, Arial, sans-serif"
      : object.type === "text"
        ? object.fontFamily
        : undefined;

  return (
    <Group
      name="editor-object"
      ref={(node) => registerNode(object.id, node)}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      scaleX={object.scaleX}
      scaleY={object.scaleY}
      visible={object.visible}
      draggable={!object.locked}
      onClick={(event) => {
        if (event.evt.button === 2) {
          return;
        }
        event.cancelBubble = true;
        onSelect(object.id, event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey);
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onSelect(object.id);
      }}
      onContextMenu={(event) => {
        event.evt.preventDefault();
        event.cancelBubble = true;
        onContextMenu(object.id, event.evt.clientX, event.evt.clientY);
      }}
      onDragStart={(event) => onDragStart(object.id, event.target as Konva.Group)}
      onDragMove={(event) =>
        onDragMove(object.id, event.target as Konva.Group, event.evt.shiftKey)
      }
      onDragEnd={(event) => onDragEnd(object.id, event.target.x(), event.target.y())}
      onTransformEnd={(event) => onTransformEnd(object.id, event.target as Konva.Group)}
    >
      {object.type === "rectangle" ? (
        <Rect
          width={object.width}
          height={object.height}
          cornerRadius={object.cornerRadius}
          fill={object.fill}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          opacity={object.opacity}
        />
      ) : null}

      {object.type === "ellipse" ? (
        <Shape
          fill={object.fill}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          opacity={object.opacity}
          sceneFunc={(context, shape) => {
            const centerX = object.width / 2;
            const centerY = object.height / 2;
            const radiusX = Math.max(object.width / 2, 1);
            const radiusY = Math.max(object.height / 2, 1);

            context.beginPath();
            context.save();
            context.translate(centerX, centerY);
            context.scale(radiusX, radiusY);
            context.arc(0, 0, 1, 0, Math.PI * 2, false);
            context.restore();
            context.closePath();
            context.fillStrokeShape(shape);
          }}
        />
      ) : null}

      {object.type === "line" || object.type === "draw" ? (
        <Line
          points={object.points}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={object.type === "draw" ? 0.2 : 0}
          opacity={object.opacity}
        />
      ) : null}

      {object.type === "text" ? (
        <>
          <Rect
            width={dimensions.width}
            height={dimensions.height}
            fill="rgba(0,0,0,0)"
            strokeEnabled={false}
          />
          <Text
            text={object.text}
            width={dimensions.width}
            height={dimensions.height}
            fontSize={object.fontSize}
            fontFamily={resolvedTextFontFamily}
            fontStyle={object.fontStyle ?? "normal"}
            align={object.textAlign ?? "left"}
            fill={object.fill}
            stroke={object.stroke === "transparent" ? undefined : object.stroke}
            strokeWidth={object.strokeWidth}
            opacity={object.opacity}
            verticalAlign="middle"
          />
        </>
      ) : null}

      {object.type === "image" ? <ImageNode object={object} /> : null}

      {isSelected ? (
        <Rect
          name="editor-export-hidden"
          width={dimensions.width}
          height={dimensions.height}
          fill="rgba(0,0,0,0)"
          stroke="#0f766e"
          strokeWidth={1}
          dash={[8, 5]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
