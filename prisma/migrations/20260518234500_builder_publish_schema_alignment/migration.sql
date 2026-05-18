-- AlterTable
ALTER TABLE "builder_saved_setups"
ADD COLUMN "published_template_id" TEXT;

-- AlterTable
ALTER TABLE "wiring_template_components"
ADD COLUMN "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "show_label" BOOLEAN NOT NULL DEFAULT false;

-- Backfill native component fields from existing metadata where possible.
UPDATE "wiring_template_components"
SET
    "scale" = COALESCE(("metadata_json"->>'scale')::DOUBLE PRECISION, 1),
    "show_label" = COALESCE(("metadata_json"->>'showLabel')::BOOLEAN, false)
WHERE "metadata_json" IS NOT NULL;

-- CreateIndex
CREATE INDEX "builder_saved_setups_published_template_id_idx" ON "builder_saved_setups"("published_template_id");

-- AddForeignKey
ALTER TABLE "builder_saved_setups"
ADD CONSTRAINT "builder_saved_setups_published_template_id_fkey"
FOREIGN KEY ("published_template_id") REFERENCES "wiring_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
