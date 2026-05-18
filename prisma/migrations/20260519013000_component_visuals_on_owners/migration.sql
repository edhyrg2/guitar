-- AlterTable
ALTER TABLE "pickup_types"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- AlterTable
ALTER TABLE "switch_types"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- AlterTable
ALTER TABLE "pot_types"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- AlterTable
ALTER TABLE "capacitors"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- AlterTable
ALTER TABLE "resistors"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- AlterTable
ALTER TABLE "mods"
ADD COLUMN "svg_url" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "anchor_points_json" JSONB,
ADD COLUMN "editor_document_json" JSONB,
ADD COLUMN "style_type" TEXT;

-- Backfill owner visual fields from existing component_assets.
UPDATE "switch_types" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'switch-type'
  AND asset."owner_id" = owner."id";

UPDATE "pot_types" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'pot-type'
  AND asset."owner_id" = owner."id";

UPDATE "capacitors" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'capacitor'
  AND asset."owner_id" = owner."id";

UPDATE "resistors" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'resistor'
  AND asset."owner_id" = owner."id";

UPDATE "pickup_types" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'pickup-type'
  AND asset."owner_id" = owner."id";

UPDATE "mods" AS owner
SET
    "svg_url" = asset."svg_url",
    "thumbnail_url" = asset."thumbnail_url",
    "width" = asset."width",
    "height" = asset."height",
    "anchor_points_json" = asset."anchor_points_json",
    "editor_document_json" = asset."editor_document_json",
    "style_type" = asset."style_type"
FROM "component_assets" AS asset
WHERE asset."owner_type" = 'mod'
  AND asset."owner_id" = owner."id";
