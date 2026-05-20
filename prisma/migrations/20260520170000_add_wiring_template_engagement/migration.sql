ALTER TABLE "wiring_templates"
ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "love_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "wiring_template_loves" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wiring_template_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiring_template_loves_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wiring_template_loves_user_id_wiring_template_id_key"
ON "wiring_template_loves"("user_id", "wiring_template_id");

CREATE INDEX "wiring_template_loves_user_id_idx"
ON "wiring_template_loves"("user_id");

CREATE INDEX "wiring_template_loves_wiring_template_id_idx"
ON "wiring_template_loves"("wiring_template_id");

ALTER TABLE "wiring_template_loves"
ADD CONSTRAINT "wiring_template_loves_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wiring_template_loves"
ADD CONSTRAINT "wiring_template_loves_wiring_template_id_fkey"
FOREIGN KEY ("wiring_template_id") REFERENCES "wiring_templates"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
