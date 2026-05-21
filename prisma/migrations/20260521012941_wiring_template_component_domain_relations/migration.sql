-- AlterTable
ALTER TABLE "wiring_template_components" ADD COLUMN     "capacitor_id" TEXT,
ADD COLUMN     "mod_id" TEXT,
ADD COLUMN     "output_jack_id" TEXT,
ADD COLUMN     "pickup_type_id" TEXT,
ADD COLUMN     "pot_type_id" TEXT,
ADD COLUMN     "resistor_id" TEXT,
ADD COLUMN     "switch_type_id" TEXT;

-- CreateIndex
CREATE INDEX "wiring_template_components_pickup_type_id_idx" ON "wiring_template_components"("pickup_type_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_switch_type_id_idx" ON "wiring_template_components"("switch_type_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_pot_type_id_idx" ON "wiring_template_components"("pot_type_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_capacitor_id_idx" ON "wiring_template_components"("capacitor_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_resistor_id_idx" ON "wiring_template_components"("resistor_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_mod_id_idx" ON "wiring_template_components"("mod_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_output_jack_id_idx" ON "wiring_template_components"("output_jack_id");

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_pickup_type_id_fkey" FOREIGN KEY ("pickup_type_id") REFERENCES "pickup_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_switch_type_id_fkey" FOREIGN KEY ("switch_type_id") REFERENCES "switch_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_pot_type_id_fkey" FOREIGN KEY ("pot_type_id") REFERENCES "pot_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_capacitor_id_fkey" FOREIGN KEY ("capacitor_id") REFERENCES "capacitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_resistor_id_fkey" FOREIGN KEY ("resistor_id") REFERENCES "resistors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_mod_id_fkey" FOREIGN KEY ("mod_id") REFERENCES "mods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_output_jack_id_fkey" FOREIGN KEY ("output_jack_id") REFERENCES "output_jacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
