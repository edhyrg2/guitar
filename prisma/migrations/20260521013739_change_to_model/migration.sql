-- AlterTable
ALTER TABLE "wiring_template_components" ADD COLUMN     "pickup_model_id" TEXT;

-- CreateIndex
CREATE INDEX "wiring_template_components_pickup_model_id_idx" ON "wiring_template_components"("pickup_model_id");

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_pickup_model_id_fkey" FOREIGN KEY ("pickup_model_id") REFERENCES "pickup_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
