-- CreateTable
CREATE TABLE "output_jacks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "jack_type" TEXT,
    "mounting_style" TEXT,
    "conductor_count" INTEGER,
    "description" TEXT,
    "svg_url" TEXT,
    "thumbnail_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "anchor_points_json" JSONB,
    "editor_document_json" JSONB,
    "style_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "output_jacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "output_jacks_slug_key" ON "output_jacks"("slug");

-- CreateIndex
CREATE INDEX "output_jacks_name_idx" ON "output_jacks"("name");

-- CreateIndex
CREATE INDEX "output_jacks_is_active_idx" ON "output_jacks"("is_active");
