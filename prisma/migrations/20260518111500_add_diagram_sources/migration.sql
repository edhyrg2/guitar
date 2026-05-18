-- CreateTable
CREATE TABLE "diagram_sources" (
    "id" TEXT NOT NULL,
    "wiring_template_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_brand" TEXT,
    "source_url" TEXT,
    "source_file_url" TEXT,
    "source_type" TEXT,
    "license_notes" TEXT,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "diagram_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagram_sources_wiring_template_id_idx" ON "diagram_sources"("wiring_template_id");

-- CreateIndex
CREATE INDEX "diagram_sources_source_type_idx" ON "diagram_sources"("source_type");

-- CreateIndex
CREATE INDEX "diagram_sources_is_official_idx" ON "diagram_sources"("is_official");

-- CreateIndex
CREATE INDEX "diagram_sources_verified_at_idx" ON "diagram_sources"("verified_at");

-- AddForeignKey
ALTER TABLE "diagram_sources" ADD CONSTRAINT "diagram_sources_wiring_template_id_fkey" FOREIGN KEY ("wiring_template_id") REFERENCES "wiring_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
