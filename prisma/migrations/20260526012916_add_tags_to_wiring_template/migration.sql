-- AlterTable
ALTER TABLE "wiring_templates" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
