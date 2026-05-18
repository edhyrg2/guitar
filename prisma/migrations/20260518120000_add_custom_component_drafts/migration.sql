-- CreateTable
CREATE TABLE "custom_component_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "document_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_component_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_component_drafts_slug_key" ON "custom_component_drafts"("slug");

-- CreateIndex
CREATE INDEX "custom_component_drafts_user_id_idx" ON "custom_component_drafts"("user_id");

-- CreateIndex
CREATE INDEX "custom_component_drafts_name_idx" ON "custom_component_drafts"("name");

-- CreateIndex
CREATE INDEX "custom_component_drafts_updated_at_idx" ON "custom_component_drafts"("updated_at");

-- AddForeignKey
ALTER TABLE "custom_component_drafts" ADD CONSTRAINT "custom_component_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
