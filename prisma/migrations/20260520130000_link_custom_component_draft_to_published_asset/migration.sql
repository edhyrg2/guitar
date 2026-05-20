-- AlterTable
ALTER TABLE "custom_component_drafts"
ADD COLUMN "published_component_asset_id" TEXT;

-- CreateIndex
CREATE INDEX "custom_component_drafts_published_component_asset_id_idx"
ON "custom_component_drafts"("published_component_asset_id");

-- AddForeignKey
ALTER TABLE "custom_component_drafts"
ADD CONSTRAINT "custom_component_drafts_published_component_asset_id_fkey"
FOREIGN KEY ("published_component_asset_id") REFERENCES "component_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
