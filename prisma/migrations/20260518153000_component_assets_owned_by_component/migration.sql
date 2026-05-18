ALTER TABLE "component_assets"
ADD COLUMN "owner_type" TEXT,
ADD COLUMN "owner_id" TEXT;

CREATE INDEX "component_assets_owner_type_owner_id_idx"
ON "component_assets"("owner_type", "owner_id");

CREATE UNIQUE INDEX "component_assets_owner_type_owner_id_key"
ON "component_assets"("owner_type", "owner_id");
