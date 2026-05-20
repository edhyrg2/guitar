-- CreateEnum
CREATE TYPE "CustomComponentDraftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "custom_component_drafts"
ADD COLUMN "status" "CustomComponentDraftStatus" NOT NULL DEFAULT 'DRAFT';
