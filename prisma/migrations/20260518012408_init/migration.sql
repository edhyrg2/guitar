-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('USER', 'DEVELOPER', 'MASTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "level" "UserLevel" NOT NULL DEFAULT 'USER',
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "type" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "coil_count" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "pickup_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_models" (
    "id" TEXT NOT NULL,
    "pickup_brand_id" TEXT NOT NULL,
    "pickup_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "position_type" TEXT,
    "wire_count" TEXT,
    "magnet_type" TEXT,
    "dc_resistance" TEXT,
    "output_level" TEXT,
    "is_active_pickup" BOOLEAN NOT NULL DEFAULT true,
    "color_code_schema_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guitar_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo_url" TEXT,
    "country" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guitar_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guitar_models" (
    "id" TEXT NOT NULL,
    "guitar_brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "series" TEXT,
    "year_start" INTEGER,
    "year_end" INTEGER,
    "body_type" TEXT,
    "default_pickup_config" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guitar_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wire_color_schemas" (
    "id" TEXT NOT NULL,
    "pickup_brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pickup_type_id" TEXT NOT NULL,
    "hot_color" TEXT,
    "ground_color" TEXT,
    "shield_color" TEXT,
    "north_start_color" TEXT,
    "north_finish_color" TEXT,
    "south_start_color" TEXT,
    "south_finish_color" TEXT,
    "battery_positive_color" TEXT,
    "battery_negative_color" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wire_color_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_configurations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pickup_count" INTEGER NOT NULL,
    "has_neck" BOOLEAN NOT NULL DEFAULT false,
    "has_middle" BOOLEAN NOT NULL DEFAULT false,
    "has_bridge" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "pickup_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "switch_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "position_count" INTEGER NOT NULL,
    "pole_count" INTEGER NOT NULL,
    "lug_count" INTEGER NOT NULL,
    "switch_category" TEXT,
    "description" TEXT,
    "svg_asset_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "switch_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pot_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value_ohm" INTEGER NOT NULL,
    "value_label" TEXT NOT NULL,
    "taper" TEXT,
    "pot_function" TEXT,
    "is_push_pull" BOOLEAN NOT NULL DEFAULT false,
    "is_push_push" BOOLEAN NOT NULL DEFAULT false,
    "is_no_load" BOOLEAN NOT NULL DEFAULT false,
    "shaft_type" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pot_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacitors" (
    "id" TEXT NOT NULL,
    "value_farads" DOUBLE PRECISION NOT NULL,
    "value_label" TEXT NOT NULL,
    "type" TEXT,
    "voltage_rating" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "capacitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resistors" (
    "id" TEXT NOT NULL,
    "value_ohm" INTEGER NOT NULL,
    "value_label" TEXT NOT NULL,
    "wattage" TEXT,
    "tolerance" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "resistors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "requires_push_pull" BOOLEAN NOT NULL DEFAULT false,
    "requires_mini_toggle" BOOLEAN NOT NULL DEFAULT false,
    "requires_special_switch" BOOLEAN NOT NULL DEFAULT false,
    "difficulty_level" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_assets" (
    "id" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "svg_url" TEXT,
    "thumbnail_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "anchor_points_json" JSONB,
    "style_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "component_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_connection_points" (
    "id" TEXT NOT NULL,
    "component_asset_id" TEXT NOT NULL,
    "point_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "point_type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "component_connection_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wire_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "hex_color" TEXT,
    "wire_function" TEXT,
    "is_shielded" BOOLEAN NOT NULL DEFAULT false,
    "is_ground" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "wire_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiring_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "pickup_configuration_id" TEXT NOT NULL,
    "switch_type_id" TEXT NOT NULL,
    "volume_count" INTEGER NOT NULL,
    "tone_count" INTEGER NOT NULL,
    "difficulty_level" TEXT,
    "diagram_json" JSONB NOT NULL,
    "switch_logic_json" JSONB NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "source_type" TEXT,
    "source_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiring_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiring_template_components" (
    "id" TEXT NOT NULL,
    "wiring_template_id" TEXT NOT NULL,
    "component_role" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata_json" JSONB,

    CONSTRAINT "wiring_template_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiring_template_connections" (
    "id" TEXT NOT NULL,
    "wiring_template_id" TEXT NOT NULL,
    "from_component_role" TEXT NOT NULL,
    "from_point_key" TEXT NOT NULL,
    "to_component_role" TEXT NOT NULL,
    "to_point_key" TEXT NOT NULL,
    "wire_type_id" TEXT NOT NULL,
    "wire_color" TEXT,
    "path_json" JSONB,
    "label" TEXT,
    "notes" TEXT,

    CONSTRAINT "wiring_template_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_level_idx" ON "User"("level");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_active_idx" ON "Brand"("active");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_types_slug_key" ON "pickup_types"("slug");

-- CreateIndex
CREATE INDEX "pickup_types_name_idx" ON "pickup_types"("name");

-- CreateIndex
CREATE INDEX "pickup_types_is_active_idx" ON "pickup_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_models_slug_key" ON "pickup_models"("slug");

-- CreateIndex
CREATE INDEX "pickup_models_name_idx" ON "pickup_models"("name");

-- CreateIndex
CREATE INDEX "pickup_models_pickup_brand_id_idx" ON "pickup_models"("pickup_brand_id");

-- CreateIndex
CREATE INDEX "pickup_models_pickup_type_id_idx" ON "pickup_models"("pickup_type_id");

-- CreateIndex
CREATE INDEX "pickup_models_is_active_pickup_idx" ON "pickup_models"("is_active_pickup");

-- CreateIndex
CREATE UNIQUE INDEX "guitar_brands_slug_key" ON "guitar_brands"("slug");

-- CreateIndex
CREATE INDEX "guitar_brands_name_idx" ON "guitar_brands"("name");

-- CreateIndex
CREATE INDEX "guitar_brands_is_active_idx" ON "guitar_brands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "guitar_models_slug_key" ON "guitar_models"("slug");

-- CreateIndex
CREATE INDEX "guitar_models_name_idx" ON "guitar_models"("name");

-- CreateIndex
CREATE INDEX "guitar_models_guitar_brand_id_idx" ON "guitar_models"("guitar_brand_id");

-- CreateIndex
CREATE INDEX "guitar_models_is_active_idx" ON "guitar_models"("is_active");

-- CreateIndex
CREATE INDEX "wire_color_schemas_name_idx" ON "wire_color_schemas"("name");

-- CreateIndex
CREATE INDEX "wire_color_schemas_pickup_brand_id_idx" ON "wire_color_schemas"("pickup_brand_id");

-- CreateIndex
CREATE INDEX "wire_color_schemas_pickup_type_id_idx" ON "wire_color_schemas"("pickup_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_configurations_code_key" ON "pickup_configurations"("code");

-- CreateIndex
CREATE INDEX "pickup_configurations_name_idx" ON "pickup_configurations"("name");

-- CreateIndex
CREATE INDEX "pickup_configurations_pickup_count_idx" ON "pickup_configurations"("pickup_count");

-- CreateIndex
CREATE UNIQUE INDEX "switch_types_slug_key" ON "switch_types"("slug");

-- CreateIndex
CREATE INDEX "switch_types_name_idx" ON "switch_types"("name");

-- CreateIndex
CREATE INDEX "switch_types_is_active_idx" ON "switch_types"("is_active");

-- CreateIndex
CREATE INDEX "pot_types_name_idx" ON "pot_types"("name");

-- CreateIndex
CREATE INDEX "pot_types_is_active_idx" ON "pot_types"("is_active");

-- CreateIndex
CREATE INDEX "capacitors_value_label_idx" ON "capacitors"("value_label");

-- CreateIndex
CREATE INDEX "capacitors_is_active_idx" ON "capacitors"("is_active");

-- CreateIndex
CREATE INDEX "resistors_value_label_idx" ON "resistors"("value_label");

-- CreateIndex
CREATE INDEX "resistors_is_active_idx" ON "resistors"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "mods_slug_key" ON "mods"("slug");

-- CreateIndex
CREATE INDEX "mods_name_idx" ON "mods"("name");

-- CreateIndex
CREATE INDEX "mods_is_active_idx" ON "mods"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "component_assets_slug_key" ON "component_assets"("slug");

-- CreateIndex
CREATE INDEX "component_assets_name_idx" ON "component_assets"("name");

-- CreateIndex
CREATE INDEX "component_assets_component_type_idx" ON "component_assets"("component_type");

-- CreateIndex
CREATE INDEX "component_assets_is_active_idx" ON "component_assets"("is_active");

-- CreateIndex
CREATE INDEX "component_connection_points_component_asset_id_idx" ON "component_connection_points"("component_asset_id");

-- CreateIndex
CREATE INDEX "component_connection_points_point_type_idx" ON "component_connection_points"("point_type");

-- CreateIndex
CREATE UNIQUE INDEX "component_connection_points_component_asset_id_point_key_key" ON "component_connection_points"("component_asset_id", "point_key");

-- CreateIndex
CREATE INDEX "wire_types_name_idx" ON "wire_types"("name");

-- CreateIndex
CREATE INDEX "wire_types_wire_function_idx" ON "wire_types"("wire_function");

-- CreateIndex
CREATE UNIQUE INDEX "wiring_templates_slug_key" ON "wiring_templates"("slug");

-- CreateIndex
CREATE INDEX "wiring_templates_name_idx" ON "wiring_templates"("name");

-- CreateIndex
CREATE INDEX "wiring_templates_pickup_configuration_id_idx" ON "wiring_templates"("pickup_configuration_id");

-- CreateIndex
CREATE INDEX "wiring_templates_switch_type_id_idx" ON "wiring_templates"("switch_type_id");

-- CreateIndex
CREATE INDEX "wiring_templates_is_verified_idx" ON "wiring_templates"("is_verified");

-- CreateIndex
CREATE INDEX "wiring_template_components_wiring_template_id_idx" ON "wiring_template_components"("wiring_template_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_asset_id_idx" ON "wiring_template_components"("asset_id");

-- CreateIndex
CREATE INDEX "wiring_template_components_component_role_idx" ON "wiring_template_components"("component_role");

-- CreateIndex
CREATE INDEX "wiring_template_connections_wiring_template_id_idx" ON "wiring_template_connections"("wiring_template_id");

-- CreateIndex
CREATE INDEX "wiring_template_connections_wire_type_id_idx" ON "wiring_template_connections"("wire_type_id");

-- CreateIndex
CREATE INDEX "wiring_template_connections_from_component_role_idx" ON "wiring_template_connections"("from_component_role");

-- CreateIndex
CREATE INDEX "wiring_template_connections_to_component_role_idx" ON "wiring_template_connections"("to_component_role");

-- AddForeignKey
ALTER TABLE "pickup_models" ADD CONSTRAINT "pickup_models_pickup_brand_id_fkey" FOREIGN KEY ("pickup_brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_models" ADD CONSTRAINT "pickup_models_pickup_type_id_fkey" FOREIGN KEY ("pickup_type_id") REFERENCES "pickup_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guitar_models" ADD CONSTRAINT "guitar_models_guitar_brand_id_fkey" FOREIGN KEY ("guitar_brand_id") REFERENCES "guitar_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wire_color_schemas" ADD CONSTRAINT "wire_color_schemas_pickup_brand_id_fkey" FOREIGN KEY ("pickup_brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wire_color_schemas" ADD CONSTRAINT "wire_color_schemas_pickup_type_id_fkey" FOREIGN KEY ("pickup_type_id") REFERENCES "pickup_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_connection_points" ADD CONSTRAINT "component_connection_points_component_asset_id_fkey" FOREIGN KEY ("component_asset_id") REFERENCES "component_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_templates" ADD CONSTRAINT "wiring_templates_pickup_configuration_id_fkey" FOREIGN KEY ("pickup_configuration_id") REFERENCES "pickup_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_templates" ADD CONSTRAINT "wiring_templates_switch_type_id_fkey" FOREIGN KEY ("switch_type_id") REFERENCES "switch_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_wiring_template_id_fkey" FOREIGN KEY ("wiring_template_id") REFERENCES "wiring_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_components" ADD CONSTRAINT "wiring_template_components_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "component_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_connections" ADD CONSTRAINT "wiring_template_connections_wiring_template_id_fkey" FOREIGN KEY ("wiring_template_id") REFERENCES "wiring_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_connections" ADD CONSTRAINT "wiring_template_connections_wire_type_id_fkey" FOREIGN KEY ("wire_type_id") REFERENCES "wire_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
