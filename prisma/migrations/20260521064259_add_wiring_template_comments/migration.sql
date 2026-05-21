-- CreateTable
CREATE TABLE "wiring_template_comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wiring_template_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiring_template_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wiring_template_comments_user_id_idx" ON "wiring_template_comments"("user_id");

-- CreateIndex
CREATE INDEX "wiring_template_comments_wiring_template_id_idx" ON "wiring_template_comments"("wiring_template_id");

-- CreateIndex
CREATE INDEX "wiring_template_comments_parent_id_idx" ON "wiring_template_comments"("parent_id");

-- CreateIndex
CREATE INDEX "wiring_template_comments_created_at_idx" ON "wiring_template_comments"("created_at");

-- AddForeignKey
ALTER TABLE "wiring_template_comments" ADD CONSTRAINT "wiring_template_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_comments" ADD CONSTRAINT "wiring_template_comments_wiring_template_id_fkey" FOREIGN KEY ("wiring_template_id") REFERENCES "wiring_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiring_template_comments" ADD CONSTRAINT "wiring_template_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "wiring_template_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
