-- AlterTable
ALTER TABLE "User" ADD COLUMN     "builder_bio" TEXT,
ADD COLUMN     "builder_experience_years" INTEGER,
ADD COLUMN     "builder_portfolio_url" TEXT,
ADD COLUMN     "builder_shop_url" TEXT,
ADD COLUMN     "builder_specialty" TEXT,
ADD COLUMN     "builder_workshop_name" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "is_builder" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_is_builder_idx" ON "User"("is_builder");
