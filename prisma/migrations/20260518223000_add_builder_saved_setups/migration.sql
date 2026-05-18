-- CreateEnum
CREATE TYPE "BuilderSavedSetupStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "builder_saved_setups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "status" "BuilderSavedSetupStatus" NOT NULL DEFAULT 'DRAFT',
    "document_json" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_saved_setups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "builder_saved_setups_slug_key" ON "builder_saved_setups"("slug");

-- CreateIndex
CREATE INDEX "builder_saved_setups_user_id_idx" ON "builder_saved_setups"("user_id");

-- CreateIndex
CREATE INDEX "builder_saved_setups_status_idx" ON "builder_saved_setups"("status");

-- CreateIndex
CREATE INDEX "builder_saved_setups_updated_at_idx" ON "builder_saved_setups"("updated_at");

-- AddForeignKey
ALTER TABLE "builder_saved_setups" ADD CONSTRAINT "builder_saved_setups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
